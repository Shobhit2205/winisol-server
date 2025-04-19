import { Request, Response } from 'express';
import prisma from '../config/db';

async function checkNftOwnership(publicKey: string, nftName: string): Promise<boolean> {
    try {
      const response = await fetch(process.env.SOLANA_RPC_URL as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: publicKey,
            page: 1,
            limit: 1000
          }
        })
      });
      
      const responseData = await response.json();
      interface Nft {
        content: {
          metadata: {
            name: string;
          };
        };
      }

      const nfts: Nft[] = responseData.result.items;

      return nfts.some((nft: Nft) => nft.content.metadata.name === nftName);
      
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      return false;
    }
}

// Type for the consistent winning lottery response structure
interface WinningLottery {
  id: number;
  lotteryName: string;
  lotteryURI: string;
  image: string;
  price: string;
  winningAmount: string;
  winnerTicketId: string;
  priceClaimed?: boolean;
  priceClaimedSignature?: string | null;
  priceClaimedTime?: Date | null;
}

export const findLotteryWinnerByPublicKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicKey } = req.params;

    // 1. Get current winnings (unclaimed prizes where user owns the NFT)
    // Find all active lotteries where a winner has been chosen but prize not claimed
    const standardLotteries = await prisma.lottery.findMany({
      where: {
        status: 'ACTIVE',
        winnerChosen: true,
        priceClaimed: false,
        winnerTicketId: { not: null }
      }
    });

    // Find all active limited lotteries where a winner has been chosen but prize not claimed
    const limitedLotteries = await prisma.limitedLottery.findMany({
      where: {
        status: 'ACTIVE',
        winnerChosen: true,
        priceClaimed: false,
        winnerTicketId: { not: null }
      }
    });

    // Check NFT ownership for standard lotteries and map to consistent structure
    const claimableStandardLotteries = await Promise.all(
      standardLotteries.map(async (lottery) => {
        const ownsWinningNft = await checkNftOwnership(publicKey, lottery.winnerTicketId!);
        if (!ownsWinningNft) return null;
        
        const winningAmount = lottery.potAmount.mul(0.9).toString(); // potAmount * 0.9
        
        return {
          id: lottery.id,
          lotteryName: lottery.lotteryName,
          lotterySymbol: lottery.lotterySymbol,
          lotteryType: "regular",
          lotteryURI: lottery.lotteryURI,
          image: lottery.image,
          price: lottery.price.toString(),
          winningAmount,
          winnerTicketId: lottery.winnerTicketId!
        } as WinningLottery;
      })
    ).then(results => results.filter(Boolean) as WinningLottery[]);

    // Check NFT ownership for limited lotteries and map to consistent structure
    const claimableLimitedLotteries = await Promise.all(
      limitedLotteries.map(async (lottery) => {
        const ownsWinningNft = await checkNftOwnership(publicKey, lottery.winnerTicketId!);
        if (!ownsWinningNft) return null;
        
        return {
          id: lottery.id,
          lotteryName: lottery.lotteryName,
          lotterySymbol: lottery.lotterySymbol,
          lotteryType: "limited",
          lotteryURI: lottery.lotteryURI,
          image: lottery.image,
          price: lottery.price.toString(),
          winningAmount: lottery.totalPotAmount.toString(),
          winnerTicketId: lottery.winnerTicketId!
        } as WinningLottery;
      })
    ).then(results => results.filter(Boolean) as WinningLottery[]);

    // 2. Get previous winnings (claimed prizes where user was the winner)
    // Find standard lotteries where user was the winner and prize was claimed
    const previousStandardWinnings = await prisma.lottery.findMany({
      where: {
        winnerPublicKey: publicKey,
        priceClaimed: true
      },
      select: {
        id: true,
        lotteryName: true,
        lotterySymbol: true,
        lotteryURI: true,
        image: true,
        price: true,
        potAmount: true,
        winnerTicketId: true,
        priceClaimed: true,
        priceClaimedSignature: true,
        priceClaimedTime: true
      }
    });

    // Find limited lotteries where user was the winner and prize was claimed
    const previousLimitedWinnings = await prisma.limitedLottery.findMany({
      where: {
        winnerPublicKey: publicKey,
        priceClaimed: true
      },
      select: {
        id: true,
        lotteryName: true,
        lotterySymbol: true,
        lotteryURI: true,
        image: true,
        price: true,
        totalPotAmount: true,
        winnerTicketId: true,
        priceClaimed: true,
        priceClaimedSignature: true,
        priceClaimedTime: true
      }
    });

    // Map previous standard winnings to consistent structure
    const mappedPreviousStandardWinnings = previousStandardWinnings.map(lottery => ({
      id: lottery.id,
      lotteryName: lottery.lotteryName,
      lotterySymbol: lottery.lotterySymbol,
      lotteryType: "Regular",
      lotteryURI: lottery.lotteryURI,
      image: lottery.image,
      price: lottery.price.toString(),
      winningAmount: lottery.potAmount.mul(0.9).toString(), // potAmount * 0.9
      winnerTicketId: lottery.winnerTicketId!,
      priceClaimed: lottery.priceClaimed,
      priceClaimedSignature: lottery.priceClaimedSignature,
      priceClaimedTime: lottery.priceClaimedTime
    }));

    // Map previous limited winnings to consistent structure
    const mappedPreviousLimitedWinnings = previousLimitedWinnings.map(lottery => ({
      id: lottery.id,
      lotteryName: lottery.lotteryName,
      lotterySymbol: lottery.lotterySymbol,
      lotteryType: "Limited",
      lotteryURI: lottery.lotteryURI,
      image: lottery.image,
      price: lottery.price.toString(),
      winningAmount: lottery.totalPotAmount.toString(),
      winnerTicketId: lottery.winnerTicketId!,
      priceClaimed: lottery.priceClaimed,
      priceClaimedSignature: lottery.priceClaimedSignature,
      priceClaimedTime: lottery.priceClaimedTime
    }));

    // Combine current winnings and previous winnings
    const currentWinnings = [...claimableStandardLotteries, ...claimableLimitedLotteries];
    const previousWinnings = [...mappedPreviousStandardWinnings, ...mappedPreviousLimitedWinnings];

    // Send response
    res.status(200).json({
      success: true,
      message: 'Lottery winners found successfully',
      currentWinnings,
      previousWinnings,
    });
    
  } catch (error) {
    console.error('Error finding lottery winner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};


export const getAllWinnersController = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get all winners from standard lotteries
      const standardWinners = await prisma.lottery.findMany({
        where: {
          winnerChosen: true,
          winnerPublicKey: { not: null },
          winnerTicketId: { not: null }
        },
        select: {
          id: true,
          lotteryName: true,
          lotterySymbol: true,
          lotteryURI: true,
          winnerPublicKey: true,
          potAmount: true,
          winnerDeclaredTime: true,
          winnerTicketId: true,
          revealWinnerSignature: true
        },
        orderBy: {
          winnerDeclaredTime: 'desc'
        }
      });
  
      // Get all winners from limited lotteries
      const limitedWinners = await prisma.limitedLottery.findMany({
        where: {
          winnerChosen: true,
          winnerPublicKey: { not: null },
          winnerTicketId: { not: null }
        },
        select: {
          id: true,
          lotteryName: true,
          lotterySymbol: true,
          lotteryURI: true,
          winnerPublicKey: true,
          totalPotAmount: true,
          winnerDeclaredTime: true,
          winnerTicketId: true,
          revealWinnerSignature: true
        },
        orderBy: {
          winnerDeclaredTime: 'desc'
        }
      });
  
      // Map standard lottery winners to the required format
      const formattedStandardWinners = standardWinners.map(winner => ({
        id: winner.id,
        lotteryName: winner.lotteryName,
        lotterySymbol: winner.lotterySymbol,
        lotteryURI: winner.lotteryURI,
        winnerPublicKey: winner.winnerPublicKey,
        winningAmount: winner.potAmount.mul(0.9).toString(), // 90% of pot amount
        winnerDeclaredTime: winner.winnerDeclaredTime,
        winnerTicketId: winner.winnerTicketId,
        revealWinnerSignature: winner.revealWinnerSignature,
        lotteryType: 'standard'
      }));
  
      // Map limited lottery winners to the required format
      const formattedLimitedWinners = limitedWinners.map(winner => ({
        id: winner.id,
        lotteryName: winner.lotteryName,
        lotterySymbol: winner.lotterySymbol,
        lotteryURI: winner.lotteryURI,
        winnerPublicKey: winner.winnerPublicKey,
        winningAmount: winner.totalPotAmount.toString(),
        winnerDeclaredTime: winner.winnerDeclaredTime,
        winnerTicketId: winner.winnerTicketId,
        revealWinnerSignature: winner.revealWinnerSignature,
        lotteryType: 'limited'
      }));
  
      // Combine and sort all winners by declared time (most recent first)
      const allWinners = [...formattedStandardWinners, ...formattedLimitedWinners]
        .sort((a, b) => {
          if (!a.winnerDeclaredTime) return 1;
          if (!b.winnerDeclaredTime) return -1;
          return b.winnerDeclaredTime.getTime() - a.winnerDeclaredTime.getTime();
        });
  
      res.status(200).json({
        success: true,
        winners: allWinners,
        total: allWinners.length
      });
    } catch (error) {
      console.error('Error fetching all winners:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
};
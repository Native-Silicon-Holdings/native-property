import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError } from '../utils/response.util';
import crypto from 'crypto';

/**
 * Cast vote
 */
export const castVote = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { electionId, candidateId } = req.body;
    const userId = req.user.userId;

    // Check election exists and is in voting phase
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        candidates: true
      }
    });

    if (!election) {
      sendError(res, 'Election not found', null, 404);
      return;
    }

    if (election.status !== 'VOTING_OPEN') {
      sendError(res, 'Voting is not open for this election', null, 400);
      return;
    }

    // Check voting window
    const now = new Date();
    if (now < election.votingStartDate || now > election.votingEndDate) {
      sendError(res, 'Voting window is closed', null, 400);
      return;
    }

    // Check candidate exists and is accepted
    const candidate = election.candidates.find(c => c.id === candidateId);
    if (!candidate) {
      sendError(res, 'Candidate not found', null, 404);
      return;
    }

    if (candidate.status !== 'ACCEPTED') {
      sendError(res, 'Candidate is not eligible for voting', null, 400);
      return;
    }

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        electionId_userId: {
          electionId,
          userId
        }
      }
    });

    if (existingVote) {
      sendError(res, 'You have already voted in this election', null, 409);
      return;
    }

    // Generate vote hash
    const voteData = `${electionId}:${userId}:${candidateId}:${now.toISOString()}`;
    const voteHash = crypto.createHash('sha256').update(voteData).digest('hex');

    // Create vote
    const vote = await prisma.vote.create({
      data: {
        electionId,
        userId,
        candidateId,
        voteHash
      }
    });

    // Update or create vote choice
    await prisma.voteChoice.upsert({
      where: {
        electionId_candidateId: {
          electionId,
          candidateId
        }
      },
      update: {
        voteCount: {
          increment: 1
        }
      },
      create: {
        electionId,
        candidateId,
        voteCount: 1
      }
    });

    sendSuccess(res, 'Vote cast successfully', { voteId: vote.id, voteHash }, 201);
  } catch (error: any) {
    console.error('Cast vote error:', error);
    sendError(res, 'Failed to cast vote', error.message, 500);
  }
};

/**
 * Get voting status
 */
export const getVotingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { electionId } = req.params;
    const userId = req.user.userId;

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        candidates: {
          where: {
            status: 'ACCEPTED'
          },
          include: {
            votes: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!election) {
      sendError(res, 'Election not found', null, 404);
      return;
    }

    // Check if user has voted
    const userVote = await prisma.vote.findUnique({
      where: {
        electionId_userId: {
          electionId,
          userId
        }
      }
    });

    const now = new Date();
    const canVote = 
      election.status === 'VOTING_OPEN' &&
      now >= election.votingStartDate &&
      now <= election.votingEndDate &&
      !userVote;

    // Calculate total votes
    const totalVotes = election.candidates.reduce((sum, c) => {
      return sum + (c.votes[0]?.voteCount || 0);
    }, 0);

    sendSuccess(res, 'Voting status retrieved successfully', {
      election: {
        id: election.id,
        title: election.title,
        status: election.status,
        votingStartDate: election.votingStartDate,
        votingEndDate: election.votingEndDate
      },
      candidates: election.candidates.map(c => ({
        id: c.id,
        userId: c.userId,
        position: c.position,
        statement: c.statement,
        voteCount: c.votes[0]?.voteCount || 0
      })),
      totalVotes,
      hasVoted: !!userVote,
      canVote
    });
  } catch (error: any) {
    console.error('Get voting status error:', error);
    sendError(res, 'Failed to get voting status', error.message, 500);
  }
};

/**
 * Verify vote
 */
export const verifyVote = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { voteId } = req.params;
    const userId = req.user.userId;

    const vote = await prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!vote) {
      sendError(res, 'Vote not found', null, 404);
      return;
    }

    // Only allow users to verify their own votes
    if (vote.userId !== userId && req.user.role !== 'DIRECTOR' && req.user.role !== 'MANAGER') {
      sendError(res, 'Unauthorized', null, 403);
      return;
    }

    // Recalculate hash for verification
    const voteData = `${vote.electionId}:${vote.userId}:${vote.candidateId}:${vote.createdAt.toISOString()}`;
    const expectedHash = crypto.createHash('sha256').update(voteData).digest('hex');
    const hashValid = vote.voteHash === expectedHash;

    sendSuccess(res, 'Vote verification retrieved successfully', {
      vote: {
        id: vote.id,
        electionId: vote.electionId,
        candidateId: vote.candidateId,
        createdAt: vote.createdAt
      },
      hashValid
    });
  } catch (error: any) {
    console.error('Verify vote error:', error);
    sendError(res, 'Failed to verify vote', error.message, 500);
  }
};

/**
 * Get election results
 */
export const getResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { electionId } = req.params;

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        candidates: {
          include: {
            votes: true
          }
        }
      }
    });

    if (!election) {
      sendError(res, 'Election not found', null, 404);
      return;
    }

    // Check if voting has closed
    const now = new Date();
    const votingClosed = election.status === 'COMPLETED' || now >= election.votingEndDate;

    if (!votingClosed) {
      sendError(res, 'Voting has not closed yet', null, 400);
      return;
    }

    // Calculate results
    const totalVotes = election.candidates.reduce((sum, c) => sum + (c.votes[0]?.voteCount || 0), 0);

    const results = election.candidates
      .map(candidate => {
        const voteCount = candidate.votes[0]?.voteCount || 0;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

        return {
          candidateId: candidate.id,
          userId: candidate.userId,
          position: candidate.position,
          statement: candidate.statement,
          voteCount,
          percentage: parseFloat(percentage.toFixed(2))
        };
      })
      .sort((a, b) => b.voteCount - a.voteCount);

    sendSuccess(res, 'Election results retrieved successfully', {
      election: {
        id: election.id,
        title: election.title,
        type: election.type,
        status: election.status
      },
      totalVotes,
      results
    });
  } catch (error: any) {
    console.error('Get results error:', error);
    sendError(res, 'Failed to get results', error.message, 500);
  }
};

/**
 * Get voting history
 */
export const getVotingHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const userId = req.user.userId;

    const votes = await prisma.vote.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sendSuccess(res, 'Voting history retrieved successfully', { votes });
  } catch (error: any) {
    console.error('Get voting history error:', error);
    sendError(res, 'Failed to get voting history', error.message, 500);
  }
};


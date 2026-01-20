import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError } from '../utils/response.util';

/**
 * Get all elections
 */
export const getElections = async (_req: Request, res: Response): Promise<void> => {
  try {
    const elections = await prisma.election.findMany({
      include: {
        candidates: {
          include: {
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sendSuccess(res, 'Elections retrieved successfully', { elections });
  } catch (error: any) {
    console.error('Get elections error:', error);
    sendError(res, 'Failed to get elections', error.message, 500);
  }
};

/**
 * Get active elections
 */
export const getActiveElections = async (_req: Request, res: Response): Promise<void> => {
  try {
    const elections = await prisma.election.findMany({
      where: {
        status: {
          in: ['NOMINATIONS_OPEN', 'VOTING_OPEN']
        }
      },
      include: {
        candidates: {
          include: {
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sendSuccess(res, 'Active elections retrieved successfully', { elections });
  } catch (error: any) {
    console.error('Get active elections error:', error);
    sendError(res, 'Failed to get active elections', error.message, 500);
  }
};

/**
 * Get elections by status
 */
export const getElectionsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.params;

    const elections = await prisma.election.findMany({
      where: {
        status: status as any
      },
      include: {
        candidates: {
          include: {
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sendSuccess(res, 'Elections retrieved successfully', { elections });
  } catch (error: any) {
    console.error('Get elections by status error:', error);
    sendError(res, 'Failed to get elections', error.message, 500);
  }
};

/**
 * Get election by ID
 */
export const getElectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        candidates: {
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

    sendSuccess(res, 'Election retrieved successfully', { election });
  } catch (error: any) {
    console.error('Get election error:', error);
    sendError(res, 'Failed to get election', error.message, 500);
  }
};

/**
 * Get election results
 */
export const getElectionResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const election = await prisma.election.findUnique({
      where: { id },
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

    // Calculate results
    const totalVotes = election.candidates.reduce((sum, c) => sum + c.votes[0]?.voteCount || 0, 0);
    
    const results = election.candidates.map(candidate => {
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
    }).sort((a, b) => b.voteCount - a.voteCount);

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
    console.error('Get election results error:', error);
    sendError(res, 'Failed to get election results', error.message, 500);
  }
};

/**
 * Create election
 */
export const createElection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, type, nominationsStartDate, nominationsEndDate, votingStartDate, votingEndDate } = req.body;

    const election = await prisma.election.create({
      data: {
        title,
        description,
        type,
        status: 'UPCOMING',
        nominationsStartDate: new Date(nominationsStartDate),
        nominationsEndDate: new Date(nominationsEndDate),
        votingStartDate: new Date(votingStartDate),
        votingEndDate: new Date(votingEndDate)
      }
    });

    sendSuccess(res, 'Election created successfully', { election }, 201);
  } catch (error: any) {
    console.error('Create election error:', error);
    sendError(res, 'Failed to create election', error.message, 500);
  }
};

/**
 * Update election
 */
export const updateElection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, type, status, nominationsStartDate, nominationsEndDate, votingStartDate, votingEndDate } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (nominationsStartDate) updateData.nominationsStartDate = new Date(nominationsStartDate);
    if (nominationsEndDate) updateData.nominationsEndDate = new Date(nominationsEndDate);
    if (votingStartDate) updateData.votingStartDate = new Date(votingStartDate);
    if (votingEndDate) updateData.votingEndDate = new Date(votingEndDate);
    if (status === 'COMPLETED') updateData.resultsPublishedAt = new Date();

    const election = await prisma.election.update({
      where: { id },
      data: updateData
    });

    sendSuccess(res, 'Election updated successfully', { election });
  } catch (error: any) {
    console.error('Update election error:', error);
    sendError(res, 'Failed to update election', error.message, 500);
  }
};

/**
 * Delete election
 */
export const deleteElection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.election.delete({
      where: { id }
    });

    sendSuccess(res, 'Election deleted successfully');
  } catch (error: any) {
    console.error('Delete election error:', error);
    sendError(res, 'Failed to delete election', error.message, 500);
  }
};

/**
 * Nominate candidate
 */
export const nominateCandidate = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { electionId } = req.params;
    const { userId, position, statement, secondedBy } = req.body;
    const nominatedBy = req.user.userId;

    // Check election exists and status
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      sendError(res, 'Election not found', null, 404);
      return;
    }

    if (election.status !== 'NOMINATIONS_OPEN') {
      sendError(res, 'Nominations are not open for this election', null, 400);
      return;
    }

    // Check if already nominated
    const existing = await prisma.candidate.findFirst({
      where: {
        electionId,
        userId,
        position
      }
    });

    if (existing) {
      sendError(res, 'User already nominated for this position', null, 409);
      return;
    }

    // Create candidate
    const candidateStatus = secondedBy ? 'ACCEPTED' : 'NOMINATED';
    const candidate = await prisma.candidate.create({
      data: {
        electionId,
        userId,
        position,
        statement,
        status: candidateStatus,
        nominatedBy,
        secondedBy: secondedBy || null
      }
    });

    sendSuccess(res, 'Candidate nominated successfully', { candidate }, 201);
  } catch (error: any) {
    console.error('Nominate candidate error:', error);
    sendError(res, 'Failed to nominate candidate', error.message, 500);
  }
};

/**
 * Second nomination
 */
export const secondNomination = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { candidateId } = req.params;
    const secondedBy = req.user.userId;

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        status: 'ACCEPTED',
        secondedBy
      }
    });

    sendSuccess(res, 'Nomination seconded successfully', { candidate });
  } catch (error: any) {
    console.error('Second nomination error:', error);
    sendError(res, 'Failed to second nomination', error.message, 500);
  }
};

/**
 * Withdraw nomination
 */
export const withdrawNomination = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { candidateId } = req.params;

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date()
      }
    });

    sendSuccess(res, 'Nomination withdrawn successfully', { candidate });
  } catch (error: any) {
    console.error('Withdraw nomination error:', error);
    sendError(res, 'Failed to withdraw nomination', error.message, 500);
  }
};


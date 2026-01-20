import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError } from '../utils/response.util';

/**
 * Get all directors
 */
export const getDirectors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const directors = await prisma.director.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });

    sendSuccess(res, 'Directors retrieved successfully', { directors });
  } catch (error: any) {
    console.error('Get directors error:', error);
    sendError(res, 'Failed to get directors', error.message, 500);
  }
};

/**
 * Get active directors
 */
export const getActiveDirectors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const directors = await prisma.director.findMany({
      where: {
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });

    sendSuccess(res, 'Active directors retrieved successfully', { directors });
  } catch (error: any) {
    console.error('Get active directors error:', error);
    sendError(res, 'Failed to get active directors', error.message, 500);
  }
};

/**
 * Get directors with expiring terms
 */
export const getExpiringDirectors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    const directors = await prisma.director.findMany({
      where: {
        isActive: true,
        termEndDate: {
          gte: now,
          lte: threeMonthsFromNow
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true
          }
        }
      },
      orderBy: {
        termEndDate: 'asc'
      }
    });

    sendSuccess(res, 'Expiring directors retrieved successfully', { directors });
  } catch (error: any) {
    console.error('Get expiring directors error:', error);
    sendError(res, 'Failed to get expiring directors', error.message, 500);
  }
};

/**
 * Get directors by position
 */
export const getDirectorsByPosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position } = req.params;

    const directors = await prisma.director.findMany({
      where: {
        position,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true
          }
        }
      },
      orderBy: {
        electedDate: 'desc'
      }
    });

    sendSuccess(res, 'Directors retrieved successfully', { directors });
  } catch (error: any) {
    console.error('Get directors by position error:', error);
    sendError(res, 'Failed to get directors', error.message, 500);
  }
};

/**
 * Get director by ID
 */
export const getDirectorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const director = await prisma.director.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true
          }
        }
      }
    });

    if (!director) {
      sendError(res, 'Director not found', null, 404);
      return;
    }

    sendSuccess(res, 'Director retrieved successfully', { director });
  } catch (error: any) {
    console.error('Get director error:', error);
    sendError(res, 'Failed to get director', error.message, 500);
  }
};

/**
 * Create director
 */
export const createDirector = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, position, electedDate, termEndDate, portfolio, biography, contactEmail } = req.body;

    // Check if user already has a director profile
    const existing = await prisma.director.findUnique({
      where: { userId }
    });

    if (existing) {
      sendError(res, 'User already has a director profile', null, 409);
      return;
    }

    const director = await prisma.director.create({
      data: {
        userId,
        position,
        electedDate: new Date(electedDate),
        termEndDate: new Date(termEndDate),
        portfolio,
        biography,
        contactEmail,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true
          }
        }
      }
    });

    sendSuccess(res, 'Director created successfully', { director }, 201);
  } catch (error: any) {
    console.error('Create director error:', error);
    sendError(res, 'Failed to create director', error.message, 500);
  }
};

/**
 * Update director
 */
export const updateDirector = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { position, electedDate, termEndDate, portfolio, biography, contactEmail, isActive } = req.body;

    const updateData: any = {};
    if (position) updateData.position = position;
    if (electedDate) updateData.electedDate = new Date(electedDate);
    if (termEndDate) updateData.termEndDate = new Date(termEndDate);
    if (portfolio !== undefined) updateData.portfolio = portfolio;
    if (biography !== undefined) updateData.biography = biography;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (isActive !== undefined) updateData.isActive = isActive;

    const director = await prisma.director.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true
          }
        }
      }
    });

    sendSuccess(res, 'Director updated successfully', { director });
  } catch (error: any) {
    console.error('Update director error:', error);
    sendError(res, 'Failed to update director', error.message, 500);
  }
};

/**
 * Delete director
 */
export const deleteDirector = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.director.delete({
      where: { id }
    });

    sendSuccess(res, 'Director deleted successfully');
  } catch (error: any) {
    console.error('Delete director error:', error);
    sendError(res, 'Failed to delete director', error.message, 500);
  }
};


import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { hashPassword } from '../utils/password.util';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import { UserRole } from '@prisma/client';

/**
 * Get all users
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, isActive, search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLogin: true,
          property: {
            select: {
              id: true,
              unitNumber: true,
              address: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    sendSuccess(res, 'Users retrieved successfully', {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    sendError(res, 'Failed to retrieve users', error.message, 500);
  }
};

/**
 * Get single user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLogin: true,
        property: {
          select: {
            id: true,
            unitNumber: true,
            address: true,
            propertyType: true
          }
        }
      }
    });

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    sendSuccess(res, 'User retrieved successfully', user);
  } catch (error: any) {
    console.error('Get user error:', error);
    sendError(res, 'Failed to retrieve user', error.message, 500);
  }
};

/**
 * Create new user (admin only)
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role, propertyId } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      sendError(res, 'User with this email already exists', null, 409);
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phoneNumber,
        role: role as UserRole || 'HOMEOWNER',
        propertyId: propertyId || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        property: {
          select: {
            id: true,
            unitNumber: true,
            address: true
          }
        }
      }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'USER_CREATED',
          module: 'USERS',
          details: { createdUserId: user.id, email: user.email },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'User created successfully', user, 201);
  } catch (error: any) {
    console.error('Create user error:', error);
    sendError(res, 'Failed to create user', error.message, 500);
  }
};

/**
 * Update user
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, role, propertyId, isActive, emailVerified } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(role && { role }),
        ...(propertyId !== undefined && { propertyId }),
        ...(isActive !== undefined && { isActive }),
        ...(emailVerified !== undefined && { emailVerified })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        emailVerified: true,
        property: {
          select: {
            id: true,
            unitNumber: true,
            address: true
          }
        }
      }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'USER_UPDATED',
          module: 'USERS',
          details: { updatedUserId: user.id, email: user.email },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'User updated successfully', user);
  } catch (error: any) {
    console.error('Update user error:', error);
    sendError(res, 'Failed to update user', error.message, 500);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (req.user && req.user.userId === id) {
      sendError(res, 'You cannot delete your own account', null, 400);
      return;
    }

    await prisma.user.delete({
      where: { id }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'USER_DELETED',
          module: 'USERS',
          details: { deletedUserId: id },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'User deleted successfully');
  } catch (error: any) {
    console.error('Delete user error:', error);
    sendError(res, 'Failed to delete user', error.message, 500);
  }
};

/**
 * Get activity logs for a user
 */
export const getUserActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId: id },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.activityLog.count({ where: { userId: id } })
    ]);

    sendSuccess(res, 'Activity logs retrieved successfully', {
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get user activity error:', error);
    sendError(res, 'Failed to retrieve activity logs', error.message, 500);
  }
};

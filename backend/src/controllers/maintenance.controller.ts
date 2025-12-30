import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import { MaintenanceCategory, Priority } from '@prisma/client';

/**
 * Get all maintenance requests with filters
 */
export const getMaintenanceRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyId, category, status, priority, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Homeowners and tenants can only see their own requests
    if (req.user && ['HOMEOWNER', 'TENANT'].includes(req.user.role)) {
      where.submittedById = req.user.userId;
    } else if (propertyId) {
      where.propertyId = propertyId;
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              unitNumber: true,
              address: true
            }
          },
          submittedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { submittedAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.maintenanceRequest.count({ where })
    ]);

    sendSuccess(res, 'Maintenance requests retrieved successfully', {
      requests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get maintenance requests error:', error);
    sendError(res, 'Failed to retrieve maintenance requests', error.message, 500);
  }
};

/**
 * Get single maintenance request by ID
 */
export const getMaintenanceRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            unitNumber: true,
            address: true
          }
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!request) {
      sendNotFound(res, 'Maintenance request not found');
      return;
    }

    // Check authorization - homeowners can only see their own requests
    if (req.user && ['HOMEOWNER', 'TENANT'].includes(req.user.role) && request.submittedById !== req.user.userId) {
      sendError(res, 'You do not have permission to view this request', null, 403);
      return;
    }

    sendSuccess(res, 'Maintenance request retrieved successfully', request);
  } catch (error: any) {
    console.error('Get maintenance request error:', error);
    sendError(res, 'Failed to retrieve maintenance request', error.message, 500);
  }
};

/**
 * Create new maintenance request
 */
export const createMaintenanceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { propertyId, category, priority, description } = req.body;

    // Handle file uploads
    const photos = req.files ? (req.files as Express.Multer.File[]).map(file => `/uploads/photos/${file.filename}`) : [];

    const request = await prisma.maintenanceRequest.create({
      data: {
        propertyId,
        submittedById: req.user.userId,
        category: category as MaintenanceCategory,
        priority: priority as Priority,
        description,
        photos
      },
      include: {
        property: {
          select: {
            id: true,
            unitNumber: true,
            address: true
          }
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'MAINTENANCE_REQUEST_CREATED',
        module: 'MAINTENANCE',
        details: { requestId: request.id, category: request.category },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Maintenance request created successfully', request, 201);
  } catch (error: any) {
    console.error('Create maintenance request error:', error);
    sendError(res, 'Failed to create maintenance request', error.message, 500);
  }
};

/**
 * Update maintenance request
 */
export const updateMaintenanceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      status,
      assignedTo,
      estimatedCost,
      actualCost,
      priority,
      description
    } = req.body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      }
    }

    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (actualCost !== undefined) updateData.actualCost = actualCost;
    if (priority) updateData.priority = priority;
    if (description) updateData.description = description;

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            unitNumber: true,
            address: true
          }
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'MAINTENANCE_REQUEST_UPDATED',
          module: 'MAINTENANCE',
          details: { requestId: request.id, updates: updateData },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Maintenance request updated successfully', request);
  } catch (error: any) {
    console.error('Update maintenance request error:', error);
    sendError(res, 'Failed to update maintenance request', error.message, 500);
  }
};

/**
 * Add feedback/rating to maintenance request
 */
export const addFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { id } = req.params;
    const { rating, feedback } = req.body;

    // Check if request exists and user submitted it
    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: { id }
    });

    if (!existingRequest) {
      sendNotFound(res, 'Maintenance request not found');
      return;
    }

    if (existingRequest.submittedById !== req.user.userId) {
      sendError(res, 'You can only rate your own maintenance requests', null, 403);
      return;
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        rating,
        feedback
      }
    });

    sendSuccess(res, 'Feedback added successfully', request);
  } catch (error: any) {
    console.error('Add feedback error:', error);
    sendError(res, 'Failed to add feedback', error.message, 500);
  }
};

/**
 * Delete maintenance request
 */
export const deleteMaintenanceRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.maintenanceRequest.delete({
      where: { id }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'MAINTENANCE_REQUEST_DELETED',
          module: 'MAINTENANCE',
          details: { requestId: id },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Maintenance request deleted successfully');
  } catch (error: any) {
    console.error('Delete maintenance request error:', error);
    sendError(res, 'Failed to delete maintenance request', error.message, 500);
  }
};

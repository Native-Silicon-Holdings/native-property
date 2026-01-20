import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import { PropertyType } from '@prisma/client';

/**
 * Get all properties
 */
export const getProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (type) {
      where.propertyType = type;
    }

    if (search) {
      where.OR = [
        { unitNumber: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { unitNumber: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.property.count({ where })
    ]);

    sendSuccess(res, 'Properties retrieved successfully', {
      properties,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get properties error:', error);
    sendError(res, 'Failed to retrieve properties', error.message, 500);
  }
};

/**
 * Get single property by ID
 */
export const getPropertyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            role: true
          }
        },
        utilityReadings: {
          orderBy: { readingDate: 'desc' },
          take: 12
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 10
        }
      }
    });

    if (!property) {
      sendNotFound(res, 'Property not found');
      return;
    }

    sendSuccess(res, 'Property retrieved successfully', property);
  } catch (error: any) {
    console.error('Get property error:', error);
    sendError(res, 'Failed to retrieve property', error.message, 500);
  }
};

/**
 * Create new property
 */
export const createProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { unitNumber, address, propertyType, squareMeters, occupants } = req.body;

    // Check if unit number already exists
    const existing = await prisma.property.findUnique({
      where: { unitNumber }
    });

    if (existing) {
      sendError(res, 'Property with this unit number already exists', null, 409);
      return;
    }

    const property = await prisma.property.create({
      data: {
        unitNumber,
        address,
        propertyType: propertyType as PropertyType,
        squareMeters,
        occupants: occupants || 1
      }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'PROPERTY_CREATED',
          module: 'PROPERTIES',
          details: { propertyId: property.id, unitNumber: property.unitNumber },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Property created successfully', property, 201);
  } catch (error: any) {
    console.error('Create property error:', error);
    sendError(res, 'Failed to create property', error.message, 500);
  }
};

/**
 * Update property
 */
export const updateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { unitNumber, address, propertyType, squareMeters, occupants } = req.body;

    const property = await prisma.property.update({
      where: { id },
      data: {
        ...(unitNumber && { unitNumber }),
        ...(address && { address }),
        ...(propertyType && { propertyType }),
        ...(squareMeters !== undefined && { squareMeters }),
        ...(occupants !== undefined && { occupants })
      }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'PROPERTY_UPDATED',
          module: 'PROPERTIES',
          details: { propertyId: property.id, unitNumber: property.unitNumber },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Property updated successfully', property);
  } catch (error: any) {
    console.error('Update property error:', error);
    sendError(res, 'Failed to update property', error.message, 500);
  }
};

/**
 * Delete property
 */
export const deleteProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.property.delete({
      where: { id }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'PROPERTY_DELETED',
          module: 'PROPERTIES',
          details: { propertyId: id },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Property deleted successfully');
  } catch (error: any) {
    console.error('Delete property error:', error);
    sendError(res, 'Failed to delete property', error.message, 500);
  }
};

/**
 * Get user's accessible properties
 */
export const getMyProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const userId = req.user.userId;
    const isAdmin = ['DIRECTOR', 'MANAGER'].includes(req.user.role);

    let properties;

    if (isAdmin) {
      // Admins see all properties
      properties = await prisma.property.findMany({
        include: {
          ownerships: {
            where: {
              isActive: true
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          unitNumber: 'asc'
        }
      });
    } else {
      // Regular users see only their properties
      const ownerships = await prisma.propertyOwnership.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          property: {
            include: {
              ownerships: {
                where: {
                  isActive: true
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      properties = ownerships.map(o => o.property);
    }

    sendSuccess(res, 'Properties retrieved successfully', { properties });
  } catch (error: any) {
    console.error('Get my properties error:', error);
    sendError(res, 'Failed to get properties', error.message, 500);
  }
};

/**
 * Get property history
 */
export const getPropertyHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { id } = req.params;
    const { category, startDate, endDate } = req.query;

    // Check access
    const isAdmin = ['DIRECTOR', 'MANAGER'].includes(req.user.role);
    if (!isAdmin) {
      const hasAccess = await prisma.propertyOwnership.findFirst({
        where: {
          propertyId: id,
          userId: req.user.userId,
          isActive: true
        }
      });

      if (!hasAccess) {
        sendError(res, 'Access denied', null, 403);
        return;
      }
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        ownerships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      }
    });

    if (!property) {
      sendError(res, 'Property not found', null, 404);
      return;
    }

    // Get current primary owner
    const currentOwner = property.ownerships.find(o => o.ownershipType === 'PRIMARY' && o.isActive);

    // Get records based on category
    const records: any = {};

    if (!category || category === 'utility') {
      const where: any = { propertyId: id };
      if (startDate) where.readingDate = { gte: new Date(startDate as string) };
      if (endDate) where.readingDate = { ...where.readingDate, lte: new Date(endDate as string) };
      records.utilityReadings = await prisma.utilityReading.findMany({
        where,
        orderBy: { readingDate: 'desc' }
      });
    }

    if (!category || category === 'maintenance') {
      records.maintenanceRequests = await prisma.maintenanceRequest.findMany({
        where: { propertyId: id },
        orderBy: { submittedAt: 'desc' }
      });
    }

    if (!category || category === 'documents') {
      records.documents = await prisma.document.findMany({
        where: { isArchived: false },
        orderBy: { uploadedAt: 'desc' },
        take: 20
      });
    }

    sendSuccess(res, 'Property history retrieved successfully', {
      property: {
        ...property,
        currentOwner: currentOwner ? {
          ...currentOwner.user,
          ownershipType: currentOwner.ownershipType,
          startDate: currentOwner.startDate
        } : null
      },
      records
    });
  } catch (error: any) {
    console.error('Get property history error:', error);
    sendError(res, 'Failed to get property history', error.message, 500);
  }
};

/**
 * Get property owners
 */
export const getPropertyOwners = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { id } = req.params;

    // Check access
    const isAdmin = ['DIRECTOR', 'MANAGER'].includes(req.user.role);
    if (!isAdmin) {
      const hasAccess = await prisma.propertyOwnership.findFirst({
        where: {
          propertyId: id,
          userId: req.user.userId,
          isActive: true
        }
      });

      if (!hasAccess) {
        sendError(res, 'Access denied', null, 403);
        return;
      }
    }

    const ownerships = await prisma.propertyOwnership.findMany({
      where: { propertyId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    sendSuccess(res, 'Property owners retrieved successfully', { ownerships });
  } catch (error: any) {
    console.error('Get property owners error:', error);
    sendError(res, 'Failed to get property owners', error.message, 500);
  }
};

/**
 * Initiate property transfer
 */
export const initiateTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { id } = req.params;
    const { newOwnerEmail, transferDate, recordsToTransfer } = req.body;

    // Check if user is current primary owner
    const currentOwnership = await prisma.propertyOwnership.findFirst({
      where: {
        propertyId: id,
        userId: req.user.userId,
        ownershipType: 'PRIMARY',
        isActive: true
      }
    });

    if (!currentOwnership) {
      sendError(res, 'Only the current primary owner can initiate transfer', null, 403);
      return;
    }

    // Create access request
    const accessRequest = await prisma.propertyAccessRequest.create({
      data: {
        propertyId: id,
        requestedByUserId: req.user.userId,
        requestedForEmail: newOwnerEmail,
        requestedRecords: recordsToTransfer || ['utility', 'maintenance', 'documents'],
        status: 'PENDING',
        transferDate: transferDate ? new Date(transferDate) : null
      }
    });

    sendSuccess(res, 'Property transfer request created successfully', { accessRequest }, 201);
  } catch (error: any) {
    console.error('Initiate transfer error:', error);
    sendError(res, 'Failed to initiate transfer', error.message, 500);
  }
};

/**
 * Get property access requests
 */
export const getAccessRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { id } = req.params;

    // Check access
    const isAdmin = ['DIRECTOR', 'MANAGER'].includes(req.user.role);
    if (!isAdmin) {
      const hasAccess = await prisma.propertyOwnership.findFirst({
        where: {
          propertyId: id,
          userId: req.user.userId,
          isActive: true
        }
      });

      if (!hasAccess) {
        sendError(res, 'Access denied', null, 403);
        return;
      }
    }

    const accessRequests = await prisma.propertyAccessRequest.findMany({
      where: { propertyId: id },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sendSuccess(res, 'Access requests retrieved successfully', { accessRequests });
  } catch (error: any) {
    console.error('Get access requests error:', error);
    sendError(res, 'Failed to get access requests', error.message, 500);
  }
};

/**
 * Approve/reject access request
 */
export const approveAccessRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { requestId } = req.params;
    const { status, adminNotes } = req.body;

    if (!['DIRECTOR', 'MANAGER'].includes(req.user.role)) {
      sendError(res, 'Only admins can approve access requests', null, 403);
      return;
    }

    const accessRequest = await prisma.propertyAccessRequest.findUnique({
      where: { id: requestId }
    });

    if (!accessRequest) {
      sendError(res, 'Access request not found', null, 404);
      return;
    }

    // Update request
    const updatedRequest = await prisma.propertyAccessRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminNotes,
        processedByUserId: req.user.userId,
        processedAt: new Date()
      }
    });

    // If approved, create ownership and transfer
    if (status === 'APPROVED') {
      // Find user by email
      const newOwner = await prisma.user.findUnique({
        where: { email: accessRequest.requestedForEmail }
      });

      if (newOwner) {
        // Deactivate old ownerships
        await prisma.propertyOwnership.updateMany({
          where: {
            propertyId: accessRequest.propertyId,
            isActive: true
          },
          data: {
            isActive: false,
            endDate: new Date()
          }
        });

        // Create new PRIMARY ownership
        await prisma.propertyOwnership.create({
          data: {
            propertyId: accessRequest.propertyId,
            userId: newOwner.id,
            ownershipType: 'PRIMARY',
            isActive: true,
            startDate: accessRequest.transferDate || new Date()
          }
        });

        // Update property's current primary owner
        await prisma.property.update({
          where: { id: accessRequest.propertyId },
          data: { currentPrimaryOwnerId: newOwner.id }
        });
      }
    }

    sendSuccess(res, 'Access request processed successfully', { accessRequest: updatedRequest });
  } catch (error: any) {
    console.error('Approve access request error:', error);
    sendError(res, 'Failed to process access request', error.message, 500);
  }
};

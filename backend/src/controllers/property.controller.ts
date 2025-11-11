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

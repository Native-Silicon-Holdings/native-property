import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import { UtilityType } from '@prisma/client';

/**
 * Get utility readings with filters
 */
export const getUtilityReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyId, utilityType, startDate, endDate, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (utilityType) {
      where.utilityType = utilityType;
    }

    if (startDate || endDate) {
      where.readingDate = {};
      if (startDate) where.readingDate.gte = new Date(startDate as string);
      if (endDate) where.readingDate.lte = new Date(endDate as string);
    }

    const [readings, total] = await Promise.all([
      prisma.utilityReading.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              unitNumber: true,
              address: true
            }
          }
        },
        orderBy: { readingDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.utilityReading.count({ where })
    ]);

    sendSuccess(res, 'Utility readings retrieved successfully', {
      readings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get utility readings error:', error);
    sendError(res, 'Failed to retrieve utility readings', error.message, 500);
  }
};

/**
 * Get consumption summary for a property
 */
export const getPropertyConsumption = async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { propertyId };

    if (startDate || endDate) {
      where.readingDate = {};
      if (startDate) where.readingDate.gte = new Date(startDate as string);
      if (endDate) where.readingDate.lte = new Date(endDate as string);
    }

    const readings = await prisma.utilityReading.findMany({
      where,
      orderBy: { readingDate: 'asc' }
    });

    // Calculate summary by utility type
    const summary = readings.reduce((acc: any, reading) => {
      if (!acc[reading.utilityType]) {
        acc[reading.utilityType] = {
          totalConsumption: 0,
          totalAmount: 0,
          readings: []
        };
      }

      acc[reading.utilityType].totalConsumption += reading.consumption;
      acc[reading.utilityType].totalAmount += reading.amount;
      acc[reading.utilityType].readings.push(reading);

      return acc;
    }, {});

    sendSuccess(res, 'Consumption summary retrieved successfully', summary);
  } catch (error: any) {
    console.error('Get property consumption error:', error);
    sendError(res, 'Failed to retrieve consumption summary', error.message, 500);
  }
};

/**
 * Add utility reading
 */
export const addUtilityReading = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { propertyId, utilityType, readingDate, meterReading, rate } = req.body;

    // Get previous reading
    const previousReading = await prisma.utilityReading.findFirst({
      where: {
        propertyId,
        utilityType,
        readingDate: { lt: new Date(readingDate) }
      },
      orderBy: { readingDate: 'desc' }
    });

    const previousMeterReading = previousReading?.meterReading || 0;
    const consumption = meterReading - previousMeterReading;
    const amount = consumption * rate;

    const reading = await prisma.utilityReading.create({
      data: {
        propertyId,
        utilityType,
        readingDate: new Date(readingDate),
        meterReading,
        previousReading: previousMeterReading,
        consumption,
        rate,
        amount,
        recordedById: req.user.userId
      },
      include: {
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
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'UTILITY_READING_ADDED',
        module: 'UTILITIES',
        details: { readingId: reading.id, propertyId, utilityType },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Utility reading added successfully', reading, 201);
  } catch (error: any) {
    console.error('Add utility reading error:', error);
    sendError(res, 'Failed to add utility reading', error.message, 500);
  }
};

/**
 * Bulk import utility readings
 */
export const bulkImportReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { readings } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
      sendError(res, 'Readings array is required', null, 400);
      return;
    }

    const createdReadings = [];
    const errors = [];

    for (const reading of readings) {
      try {
        const { propertyId, utilityType, readingDate, meterReading, rate } = reading;

        // Get previous reading
        const previousReading = await prisma.utilityReading.findFirst({
          where: {
            propertyId,
            utilityType,
            readingDate: { lt: new Date(readingDate) }
          },
          orderBy: { readingDate: 'desc' }
        });

        const previousMeterReading = previousReading?.meterReading || 0;
        const consumption = meterReading - previousMeterReading;
        const amount = consumption * rate;

        const newReading = await prisma.utilityReading.create({
          data: {
            propertyId,
            utilityType,
            readingDate: new Date(readingDate),
            meterReading,
            previousReading: previousMeterReading,
            consumption,
            rate,
            amount,
            recordedById: req.user.userId
          }
        });

        createdReadings.push(newReading);
      } catch (error: any) {
        errors.push({
          reading,
          error: error.message
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'UTILITY_READINGS_BULK_IMPORTED',
        module: 'UTILITIES',
        details: { count: createdReadings.length, errors: errors.length },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Bulk import completed', {
      successful: createdReadings.length,
      failed: errors.length,
      errors
    }, 201);
  } catch (error: any) {
    console.error('Bulk import readings error:', error);
    sendError(res, 'Failed to bulk import readings', error.message, 500);
  }
};

/**
 * Get payments for a property
 */
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyId, startDate, endDate, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              unitNumber: true,
              address: true
            }
          }
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.payment.count({ where })
    ]);

    sendSuccess(res, 'Payments retrieved successfully', {
      payments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get payments error:', error);
    sendError(res, 'Failed to retrieve payments', error.message, 500);
  }
};

/**
 * Record a payment
 */
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const {
      propertyId,
      amount,
      paymentDate,
      paymentMethod,
      reference,
      allocatedTo,
      status,
      receiptUrl
    } = req.body;

    const payment = await prisma.payment.create({
      data: {
        propertyId,
        amount,
        paymentDate: new Date(paymentDate),
        paymentMethod,
        reference,
        allocatedTo,
        status: status || 'PENDING',
        receiptUrl
      },
      include: {
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
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'PAYMENT_RECORDED',
        module: 'UTILITIES',
        details: { paymentId: payment.id, propertyId, amount },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Payment recorded successfully', payment, 201);
  } catch (error: any) {
    console.error('Record payment error:', error);
    sendError(res, 'Failed to record payment', error.message, 500);
  }
};

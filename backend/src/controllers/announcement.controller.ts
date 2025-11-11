import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import { AnnouncementCategory, Priority } from '@prisma/client';

/**
 * Get all announcements with filters
 */
export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, priority, search, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search as string, mode: 'insensitive' } },
            { content: { contains: search as string, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          postedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          reads: req.user ? {
            where: {
              userId: req.user.userId
            }
          } : false
        },
        orderBy: [
          { isPinned: 'desc' },
          { postedAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.announcement.count({ where })
    ]);

    sendSuccess(res, 'Announcements retrieved successfully', {
      announcements,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get announcements error:', error);
    sendError(res, 'Failed to retrieve announcements', error.message, 500);
  }
};

/**
 * Get single announcement by ID
 */
export const getAnnouncementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        postedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reads: {
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
    });

    if (!announcement) {
      sendNotFound(res, 'Announcement not found');
      return;
    }

    // Mark as read if user is authenticated
    if (req.user) {
      await prisma.announcementRead.upsert({
        where: {
          announcementId_userId: {
            announcementId: id,
            userId: req.user.userId
          }
        },
        create: {
          announcementId: id,
          userId: req.user.userId,
          acknowledged: false
        },
        update: {
          readAt: new Date()
        }
      });
    }

    sendSuccess(res, 'Announcement retrieved successfully', announcement);
  } catch (error: any) {
    console.error('Get announcement error:', error);
    sendError(res, 'Failed to retrieve announcement', error.message, 500);
  }
};

/**
 * Create new announcement
 */
export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const {
      title,
      content,
      category,
      priority,
      isPinned,
      requiresAcknowledgment,
      attachments,
      expiresAt
    } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        category: category as AnnouncementCategory,
        priority: priority as Priority || 'MEDIUM',
        isPinned: isPinned || false,
        requiresAcknowledgment: requiresAcknowledgment || false,
        attachments: attachments || [],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        postedById: req.user.userId
      },
      include: {
        postedBy: {
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
        action: 'ANNOUNCEMENT_CREATED',
        module: 'ANNOUNCEMENTS',
        details: { announcementId: announcement.id, title: announcement.title },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Announcement created successfully', announcement, 201);
  } catch (error: any) {
    console.error('Create announcement error:', error);
    sendError(res, 'Failed to create announcement', error.message, 500);
  }
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      category,
      priority,
      isPinned,
      requiresAcknowledgment,
      attachments,
      expiresAt
    } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(priority && { priority }),
        ...(isPinned !== undefined && { isPinned }),
        ...(requiresAcknowledgment !== undefined && { requiresAcknowledgment }),
        ...(attachments && { attachments }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
      },
      include: {
        postedBy: {
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
          action: 'ANNOUNCEMENT_UPDATED',
          module: 'ANNOUNCEMENTS',
          details: { announcementId: announcement.id, title: announcement.title },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Announcement updated successfully', announcement);
  } catch (error: any) {
    console.error('Update announcement error:', error);
    sendError(res, 'Failed to update announcement', error.message, 500);
  }
};

/**
 * Acknowledge announcement
 */
export const acknowledgeAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { id } = req.params;

    const read = await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: req.user.userId
        }
      },
      create: {
        announcementId: id,
        userId: req.user.userId,
        acknowledged: true
      },
      update: {
        acknowledged: true,
        readAt: new Date()
      }
    });

    sendSuccess(res, 'Announcement acknowledged successfully', read);
  } catch (error: any) {
    console.error('Acknowledge announcement error:', error);
    sendError(res, 'Failed to acknowledge announcement', error.message, 500);
  }
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({
      where: { id }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'ANNOUNCEMENT_DELETED',
          module: 'ANNOUNCEMENTS',
          details: { announcementId: id },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Announcement deleted successfully');
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    sendError(res, 'Failed to delete announcement', error.message, 500);
  }
};

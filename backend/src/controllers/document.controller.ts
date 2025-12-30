import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import { DocumentCategory } from '@prisma/client';

/**
 * Get all documents with filters
 */
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, isArchived, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isArchived !== undefined) {
      where.isArchived = isArchived === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.document.count({ where })
    ]);

    sendSuccess(res, 'Documents retrieved successfully', {
      documents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get documents error:', error);
    sendError(res, 'Failed to retrieve documents', error.message, 500);
  }
};

/**
 * Get single document by ID
 */
export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });

    if (!document) {
      sendNotFound(res, 'Document not found');
      return;
    }

    sendSuccess(res, 'Document retrieved successfully', document);
  } catch (error: any) {
    console.error('Get document error:', error);
    sendError(res, 'Failed to retrieve document', error.message, 500);
  }
};

/**
 * Upload new document
 */
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    if (!req.file) {
      sendError(res, 'No file uploaded', null, 400);
      return;
    }

    const { title, description, category, tags } = req.body;

    const document = await prisma.document.create({
      data: {
        title,
        description,
        category: category as DocumentCategory,
        fileUrl: `/uploads/documents/${req.file.filename}`,
        fileSize: req.file.size,
        tags: tags ? JSON.parse(tags) : [],
        uploadedById: req.user.userId
      },
      include: {
        uploadedBy: {
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
        action: 'DOCUMENT_UPLOADED',
        module: 'DOCUMENTS',
        details: { documentId: document.id, title: document.title },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Document uploaded successfully', document, 201);
  } catch (error: any) {
    console.error('Upload document error:', error);
    sendError(res, 'Failed to upload document', error.message, 500);
  }
};

/**
 * Update document metadata
 */
export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, isArchived, approvalStatus } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(isArchived !== undefined && { isArchived }),
        ...(approvalStatus && { approvalStatus })
      },
      include: {
        uploadedBy: {
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
          action: 'DOCUMENT_UPDATED',
          module: 'DOCUMENTS',
          details: { documentId: document.id, title: document.title },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Document updated successfully', document);
  } catch (error: any) {
    console.error('Update document error:', error);
    sendError(res, 'Failed to update document', error.message, 500);
  }
};

/**
 * Upload new version of document
 */
export const uploadDocumentVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    if (!req.file) {
      sendError(res, 'No file uploaded', null, 400);
      return;
    }

    const { id } = req.params;
    const { changeNotes } = req.body;

    // Get current document
    const currentDocument = await prisma.document.findUnique({
      where: { id }
    });

    if (!currentDocument) {
      sendNotFound(res, 'Document not found');
      return;
    }

    // Create version entry for current document
    await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: currentDocument.version,
        fileUrl: currentDocument.fileUrl,
        changeNotes: 'Previous version',
        uploadedById: currentDocument.uploadedById
      }
    });

    // Update document with new version
    const document = await prisma.document.update({
      where: { id },
      data: {
        fileUrl: `/uploads/documents/${req.file.filename}`,
        fileSize: req.file.size,
        version: currentDocument.version + 1,
        uploadedById: req.user.userId,
        uploadedAt: new Date()
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });

    // Create version entry for new version
    await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: document.version,
        fileUrl: document.fileUrl,
        changeNotes,
        uploadedById: req.user.userId
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'DOCUMENT_VERSION_UPLOADED',
        module: 'DOCUMENTS',
        details: { documentId: document.id, version: document.version },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Document version uploaded successfully', document);
  } catch (error: any) {
    console.error('Upload document version error:', error);
    sendError(res, 'Failed to upload document version', error.message, 500);
  }
};

/**
 * Delete document
 */
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.document.delete({
      where: { id }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'DOCUMENT_DELETED',
          module: 'DOCUMENTS',
          details: { documentId: id },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Document deleted successfully');
  } catch (error: any) {
    console.error('Delete document error:', error);
    sendError(res, 'Failed to delete document', error.message, 500);
  }
};

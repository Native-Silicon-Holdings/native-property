import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.util';
import { MeetingType, RSVPStatus } from '@prisma/client';

/**
 * Get all meetings with filters
 */
export const getMeetings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, upcoming, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (upcoming === 'true') {
      where.scheduledDate = { gte: new Date() };
      where.status = 'SCHEDULED';
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          attendance: {
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
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.meeting.count({ where })
    ]);

    sendSuccess(res, 'Meetings retrieved successfully', {
      meetings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get meetings error:', error);
    sendError(res, 'Failed to retrieve meetings', error.message, 500);
  }
};

/**
 * Get single meeting by ID
 */
export const getMeetingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attendance: {
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
        },
        resolutions: {
          include: {
            proposer: {
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
        }
      }
    });

    if (!meeting) {
      sendNotFound(res, 'Meeting not found');
      return;
    }

    sendSuccess(res, 'Meeting retrieved successfully', meeting);
  } catch (error: any) {
    console.error('Get meeting error:', error);
    sendError(res, 'Failed to retrieve meeting', error.message, 500);
  }
};

/**
 * Create new meeting
 */
export const createMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const {
      title,
      type,
      description,
      scheduledDate,
      location,
      agendaUrl,
      requiredQuorum
    } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        title,
        type: type as MeetingType,
        description,
        scheduledDate: new Date(scheduledDate),
        location,
        agendaUrl,
        requiredQuorum: requiredQuorum || 0,
        createdById: req.user.userId
      },
      include: {
        createdBy: {
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
        action: 'MEETING_CREATED',
        module: 'MEETINGS',
        details: { meetingId: meeting.id, title: meeting.title },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Meeting created successfully', meeting, 201);
  } catch (error: any) {
    console.error('Create meeting error:', error);
    sendError(res, 'Failed to create meeting', error.message, 500);
  }
};

/**
 * Update meeting
 */
export const updateMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      type,
      description,
      scheduledDate,
      location,
      agendaUrl,
      minutesUrl,
      status,
      requiredQuorum
    } = req.body;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
        ...(location && { location }),
        ...(agendaUrl !== undefined && { agendaUrl }),
        ...(minutesUrl !== undefined && { minutesUrl }),
        ...(status && { status }),
        ...(requiredQuorum !== undefined && { requiredQuorum })
      },
      include: {
        createdBy: {
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
          action: 'MEETING_UPDATED',
          module: 'MEETINGS',
          details: { meetingId: meeting.id, title: meeting.title },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Meeting updated successfully', meeting);
  } catch (error: any) {
    console.error('Update meeting error:', error);
    sendError(res, 'Failed to update meeting', error.message, 500);
  }
};

/**
 * RSVP to meeting
 */
export const rsvpMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { id } = req.params;
    const { rsvpStatus, proxyFor } = req.body;

    const attendance = await prisma.meetingAttendance.upsert({
      where: {
        meetingId_userId: {
          meetingId: id,
          userId: req.user.userId
        }
      },
      create: {
        meetingId: id,
        userId: req.user.userId,
        rsvpStatus: rsvpStatus as RSVPStatus,
        proxyFor
      },
      update: {
        rsvpStatus: rsvpStatus as RSVPStatus,
        proxyFor
      }
    });

    sendSuccess(res, 'RSVP recorded successfully', attendance);
  } catch (error: any) {
    console.error('RSVP meeting error:', error);
    sendError(res, 'Failed to record RSVP', error.message, 500);
  }
};

/**
 * Record actual attendance
 */
export const recordAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { attendees } = req.body;

    if (!Array.isArray(attendees)) {
      sendError(res, 'Attendees array is required', null, 400);
      return;
    }

    const results = [];

    for (const attendee of attendees) {
      const attendance = await prisma.meetingAttendance.upsert({
        where: {
          meetingId_userId: {
            meetingId: id,
            userId: attendee.userId
          }
        },
        create: {
          meetingId: id,
          userId: attendee.userId,
          actualAttendance: attendee.attended,
          proxyFor: attendee.proxyFor
        },
        update: {
          actualAttendance: attendee.attended,
          proxyFor: attendee.proxyFor
        }
      });

      results.push(attendance);
    }

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'MEETING_ATTENDANCE_RECORDED',
          module: 'MEETINGS',
          details: { meetingId: id, attendeeCount: results.length },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Attendance recorded successfully', results);
  } catch (error: any) {
    console.error('Record attendance error:', error);
    sendError(res, 'Failed to record attendance', error.message, 500);
  }
};

/**
 * Delete meeting
 */
export const deleteMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.meeting.delete({
      where: { id }
    });

    // Log activity
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: 'MEETING_DELETED',
          module: 'MEETINGS',
          details: { meetingId: id },
          ipAddress: req.ip
        }
      });
    }

    sendSuccess(res, 'Meeting deleted successfully');
  } catch (error: any) {
    console.error('Delete meeting error:', error);
    sendError(res, 'Failed to delete meeting', error.message, 500);
  }
};

/**
 * Record attendance for specific user
 */
export const recordUserAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meetingId, userId } = req.params;
    const { actualAttendance } = req.body;

    const attendance = await prisma.meetingAttendance.upsert({
      where: {
        meetingId_userId: {
          meetingId,
          userId
        }
      },
      create: {
        meetingId,
        userId,
        actualAttendance: actualAttendance === true
      },
      update: {
        actualAttendance: actualAttendance === true
      }
    });

    sendSuccess(res, 'Attendance recorded successfully', attendance);
  } catch (error: any) {
    console.error('Record user attendance error:', error);
    sendError(res, 'Failed to record attendance', error.message, 500);
  }
};

/**
 * Get meeting attendance
 */
export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const attendance = await prisma.meetingAttendance.findMany({
      where: { meetingId },
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
        createdAt: 'asc'
      }
    });

    sendSuccess(res, 'Attendance retrieved successfully', { attendance });
  } catch (error: any) {
    console.error('Get attendance error:', error);
    sendError(res, 'Failed to get attendance', error.message, 500);
  }
};

/**
 * Create resolution
 */
export const createResolution = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { meetingId } = req.params;
    const { title, description } = req.body;

    // Check meeting exists and is scheduled
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      sendError(res, 'Meeting not found', null, 404);
      return;
    }

    const resolution = await prisma.resolution.create({
      data: {
        meetingId,
        title,
        description,
        proposedBy: req.user.userId
      },
      include: {
        proposer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    sendSuccess(res, 'Resolution created successfully', { resolution }, 201);
  } catch (error: any) {
    console.error('Create resolution error:', error);
    sendError(res, 'Failed to create resolution', error.message, 500);
  }
};

/**
 * Vote on resolution
 */
export const voteOnResolution = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', null, 401);
      return;
    }

    const { resolutionId } = req.params;
    const { vote } = req.body;

    if (!['FOR', 'AGAINST', 'ABSTAIN'].includes(vote)) {
      sendError(res, 'Invalid vote. Must be FOR, AGAINST, or ABSTAIN', null, 400);
      return;
    }

    // Get resolution with meeting
    const resolution = await prisma.resolution.findUnique({
      where: { id: resolutionId },
      include: {
        meeting: true
      }
    });

    if (!resolution) {
      sendError(res, 'Resolution not found', null, 404);
      return;
    }

    // Check meeting is scheduled
    if (resolution.meeting.status !== 'SCHEDULED') {
      sendError(res, 'Voting on resolutions is only allowed while meeting is scheduled', null, 400);
      return;
    }

    // Update vote counts
    const updateData: any = {};
    if (vote === 'FOR') {
      updateData.votesFor = { increment: 1 };
    } else if (vote === 'AGAINST') {
      updateData.votesAgainst = { increment: 1 };
    } else if (vote === 'ABSTAIN') {
      updateData.votesAbstain = { increment: 1 };
    }

    const updatedResolution = await prisma.resolution.update({
      where: { id: resolutionId },
      data: updateData
    });

    sendSuccess(res, 'Vote recorded successfully', { resolution: updatedResolution });
  } catch (error: any) {
    console.error('Vote on resolution error:', error);
    sendError(res, 'Failed to vote on resolution', error.message, 500);
  }
};

/**
 * Get resolution results
 */
export const getResolutionResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resolutionId } = req.params;

    const resolution = await prisma.resolution.findUnique({
      where: { id: resolutionId },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            status: true
          }
        },
        proposer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!resolution) {
      sendError(res, 'Resolution not found', null, 404);
      return;
    }

    const totalVotes = resolution.votesFor + resolution.votesAgainst + resolution.votesAbstain;

    sendSuccess(res, 'Resolution results retrieved successfully', {
      resolution: {
        ...resolution,
        totalVotes,
        forPercentage: totalVotes > 0 ? ((resolution.votesFor / totalVotes) * 100).toFixed(2) : '0',
        againstPercentage: totalVotes > 0 ? ((resolution.votesAgainst / totalVotes) * 100).toFixed(2) : '0',
        abstainPercentage: totalVotes > 0 ? ((resolution.votesAbstain / totalVotes) * 100).toFixed(2) : '0'
      }
    });
  } catch (error: any) {
    console.error('Get resolution results error:', error);
    sendError(res, 'Failed to get resolution results', error.message, 500);
  }
};

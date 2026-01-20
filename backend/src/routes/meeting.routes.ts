import { Router } from 'express';
import { body } from 'express-validator';
import * as meetingController from '../controllers/meeting.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All meeting routes require authentication
router.use(authenticate);

// Validation rules
const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['AGM', 'SPECIAL', 'BOARD', 'COMMITTEE']).withMessage('Valid meeting type is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('location').trim().notEmpty().withMessage('Location is required')
];

const rsvpValidation = [
  body('rsvpStatus').isIn(['ATTENDING', 'NOT_ATTENDING', 'MAYBE']).withMessage('Valid RSVP status is required')
];

// Routes
router.get('/', meetingController.getMeetings);
router.get('/:id', meetingController.getMeetingById);

router.post(
  '/',
  authorize('DIRECTOR', 'MANAGER'),
  validate(createValidation),
  meetingController.createMeeting
);

router.put(
  '/:id',
  authorize('DIRECTOR', 'MANAGER'),
  meetingController.updateMeeting
);

router.post(
  '/:id/rsvp',
  validate(rsvpValidation),
  meetingController.rsvpMeeting
);

router.post(
  '/:id/attendance',
  authorize('DIRECTOR', 'MANAGER'),
  meetingController.recordAttendance
);

router.get(
  '/:meetingId/attendance',
  meetingController.getAttendance
);

router.put(
  '/:meetingId/attendance/:userId',
  authorize('DIRECTOR', 'MANAGER'),
  meetingController.recordUserAttendance
);

router.post(
  '/:meetingId/resolutions',
  meetingController.createResolution
);

router.post(
  '/resolutions/:resolutionId/vote',
  meetingController.voteOnResolution
);

router.get(
  '/resolutions/:resolutionId/results',
  meetingController.getResolutionResults
);

router.delete(
  '/:id',
  authorize('DIRECTOR'),
  meetingController.deleteMeeting
);

export default router;

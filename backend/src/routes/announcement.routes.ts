import { Router } from 'express';
import { body } from 'express-validator';
import * as announcementController from '../controllers/announcement.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Validation rules
const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').isIn(['URGENT', 'MAINTENANCE', 'FINANCIAL', 'SOCIAL', 'GENERAL'])
    .withMessage('Valid category is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Valid priority is required')
];

// Routes
router.get('/', optionalAuth, announcementController.getAnnouncements);
router.get('/:id', optionalAuth, announcementController.getAnnouncementById);

router.post(
  '/',
  authenticate,
  authorize('DIRECTOR', 'MANAGER'),
  validate(createValidation),
  announcementController.createAnnouncement
);

router.put(
  '/:id',
  authenticate,
  authorize('DIRECTOR', 'MANAGER'),
  announcementController.updateAnnouncement
);

router.post(
  '/:id/acknowledge',
  authenticate,
  announcementController.acknowledgeAnnouncement
);

router.delete(
  '/:id',
  authenticate,
  authorize('DIRECTOR'),
  announcementController.deleteAnnouncement
);

export default router;

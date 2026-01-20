import { Router } from 'express';
import { body } from 'express-validator';
import * as directorController from '../controllers/director.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All director routes require authentication
router.use(authenticate);

// Validation rules
const createValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('electedDate').isISO8601().withMessage('Valid elected date is required'),
  body('termEndDate').isISO8601().withMessage('Valid term end date is required')
];

// Routes
router.get('/', directorController.getDirectors);
router.get('/active', directorController.getActiveDirectors);
router.get('/expiring', directorController.getExpiringDirectors);
router.get('/position/:position', directorController.getDirectorsByPosition);
router.get('/:id', directorController.getDirectorById);

router.post(
  '/',
  authorize('DIRECTOR', 'MANAGER'),
  validate(createValidation),
  directorController.createDirector
);

router.put(
  '/:id',
  authorize('DIRECTOR', 'MANAGER'),
  directorController.updateDirector
);

router.delete(
  '/:id',
  authorize('DIRECTOR'),
  directorController.deleteDirector
);

export default router;






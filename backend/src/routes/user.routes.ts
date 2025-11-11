import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Validation rules
const createValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').optional().isIn(['DIRECTOR', 'MANAGER', 'HOMEOWNER', 'TENANT', 'ACCOUNTANT'])
    .withMessage('Valid role is required')
];

// Routes
router.get('/', authorize('DIRECTOR', 'MANAGER'), userController.getUsers);
router.get('/:id', userController.getUserById);
router.get('/:id/activity', authorize('DIRECTOR', 'MANAGER'), userController.getUserActivity);

router.post(
  '/',
  authorize('DIRECTOR', 'MANAGER'),
  validate(createValidation),
  userController.createUser
);

router.put(
  '/:id',
  authorize('DIRECTOR', 'MANAGER'),
  userController.updateUser
);

router.delete(
  '/:id',
  authorize('DIRECTOR'),
  userController.deleteUser
);

export default router;

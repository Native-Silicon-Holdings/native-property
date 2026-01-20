import { Router } from 'express';
import { body } from 'express-validator';
import * as electionController from '../controllers/election.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All election routes require authentication
router.use(authenticate);

// Validation rules
const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['DIRECTOR', 'COMMITTEE', 'RESOLUTION']).withMessage('Valid election type is required'),
  body('nominationsStartDate').isISO8601().withMessage('Valid nominations start date is required'),
  body('nominationsEndDate').isISO8601().withMessage('Valid nominations end date is required'),
  body('votingStartDate').isISO8601().withMessage('Valid voting start date is required'),
  body('votingEndDate').isISO8601().withMessage('Valid voting end date is required')
];

const nominateValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('position').trim().notEmpty().withMessage('Position is required')
];

// Routes
router.get('/', electionController.getElections);
router.get('/active', electionController.getActiveElections);
router.get('/status/:status', electionController.getElectionsByStatus);
router.get('/:id', electionController.getElectionById);
router.get('/:id/results', electionController.getElectionResults);

router.post(
  '/',
  authorize('DIRECTOR', 'MANAGER'),
  validate(createValidation),
  electionController.createElection
);

router.put(
  '/:id',
  authorize('DIRECTOR', 'MANAGER'),
  electionController.updateElection
);

router.delete(
  '/:id',
  authorize('DIRECTOR'),
  electionController.deleteElection
);

router.post(
  '/:electionId/nominate',
  validate(nominateValidation),
  electionController.nominateCandidate
);

router.post(
  '/candidates/:candidateId/second',
  electionController.secondNomination
);

router.post(
  '/candidates/:candidateId/withdraw',
  electionController.withdrawNomination
);

export default router;






import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';
import {
  createPassport,
  getPassportById,
  updatePassport,
  deletePassport
} from '../controllers/passportController.js';
const router = express.Router();

// Create (admin)
router.post('/', authenticate, authorizeRole(['admin']), createPassport);

// Read (admin/user)
router.get('/:id', authenticate, authorizeRole(['admin', 'user']), getPassportById);

// Update (admin)
router.put('/:id', authenticate, authorizeRole(['admin']), updatePassport);

// Delete (admin)
router.delete('/:id', authenticate, authorizeRole(['admin']), deletePassport);

export default router;

import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';
import {
  listPassports,
  createPassport,
  getPassportById,
  updatePassport,
  deletePassport
} from '../controllers/passportController.js';

const router = express.Router();

// List (admin/user)  -> GET /api/passports
router.get('/', authenticate, authorizeRole(['admin', 'user']), listPassports);

// Create (admin)     -> POST /api/passports
router.post('/', authenticate, authorizeRole(['admin']), createPassport);

// Read (admin/user)  -> GET /api/passports/:id
router.get('/:id', authenticate, authorizeRole(['admin', 'user']), getPassportById);

// Update (admin)     -> PUT /api/passports/:id
router.put('/:id', authenticate, authorizeRole(['admin']), updatePassport);

// Delete (admin)     -> DELETE /api/passports/:id
router.delete('/:id', authenticate, authorizeRole(['admin']), deletePassport);

export default router;

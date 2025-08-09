import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeRole } from '../middlewares/roleMiddleware.js';
import {
  uploadMiddleware,
  uploadDocument,
  getDocumentLink,
  updateDocumentMeta,
  deleteDocument
} from '../controllers/documentController.js';

const router = express.Router();

// Upload (any authenticated user)
router.post('/upload', authenticate, uploadMiddleware, uploadDocument);

// Get presigned link (auth)
router.get('/:docId', authenticate, getDocumentLink);

// Update metadata
router.put('/:docId', authenticate, authorizeRole(['admin']), updateDocumentMeta);

// Delete (admin only)
router.delete('/:docId', authenticate, authorizeRole(['admin']), deleteDocument);

export default router;

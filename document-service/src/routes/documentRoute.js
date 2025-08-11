// external dependencies
import express from "express";

// internal dependencies
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRole } from "../middlewares/roleMiddleware.js";
import {
  uploadMiddleware,
  uploadDocument,
  getDocumentLink,
  updateDocumentMeta,
  deleteDocument,
  downloadDocument
} from "../controllers/documentController.js";

const router = express.Router();

// Upload (any authenticated user)
router.post("/upload", authenticate, uploadMiddleware, uploadDocument);

// Get presigned link
router.get("/:docId", authenticate, getDocumentLink);

// Stream download via service
router.get("/:docId/download", authenticate, downloadDocument);

// Update metadata (admin)
router.put("/:docId", authenticate, authorizeRole(["admin"]), updateDocumentMeta);

// Delete (admin)
router.delete("/:docId", authenticate, authorizeRole(["admin"]), deleteDocument);

export default router;

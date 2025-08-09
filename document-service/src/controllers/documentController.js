import multer from 'multer';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../s3.js';
import { config } from '../config.js';
import { Document } from '../models/documentModel.js';

// Multer: keep file in memory buffer for direct S3 upload
const upload = multer({ storage: multer.memoryStorage() });
export const uploadMiddleware = upload.single('file');

// POST /api/documents/upload
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'file is required (multipart/form-data key: file)' });

    const key = `${Date.now()}_${req.file.originalname}`;

    await s3.send(new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }));

    const doc = await Document.create({
      fileName: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      s3Key: key,
      bucket: config.s3.bucket,
      uploadedBy: req.user?.id || null
    });

    return res.status(201).json({
      docId: doc._id,
      fileName: doc.fileName,
      createdAt: doc.createdAt
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/documents/:docId  -> return a presigned GET URL
export const getDocumentLink = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Optional: verify object exists
    try {
      await s3.send(new HeadObjectCommand({ Bucket: doc.bucket, Key: doc.s3Key }));
    } catch {
      return res.status(404).json({ message: 'Object not found in bucket' });
    }

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: doc.bucket, Key: doc.s3Key }),
      { expiresIn: 60 } // seconds
    );

    return res.status(200).json({
      url,
      fileName: doc.fileName,
      contentType: doc.contentType
    });
  } catch (err) {
    console.error('Get link error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/documents/:docId  -> update metadata (e.g., fileName)
export const updateDocumentMeta = async (req, res) => {
  try {
    const { docId } = req.params;
    const { fileName } = req.body;

    const update = {};
    if (fileName) update.fileName = fileName;

    const updated = await Document.findByIdAndUpdate(docId, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Document not found' });

    return res.status(200).json(updated);
  } catch (err) {
    console.error('Update meta error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/documents/:docId
export const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    await s3.send(new DeleteObjectCommand({ Bucket: doc.bucket, Key: doc.s3Key }));
    await Document.findByIdAndDelete(docId);

    return res.status(200).json({ message: 'Deleted', docId });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

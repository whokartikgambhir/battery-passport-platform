import multer from 'multer';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../s3.js';
import { config } from '../config.js';
import { Document } from '../models/documentModel.js';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pump = promisify(pipeline);

// Multer: keep file in memory buffer for direct S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB cap (tweak as needed)
});
export const uploadMiddleware = upload.single('file');

// POST /api/documents/upload
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'file is required (multipart/form-data key: file)' });
    }

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

// GET /api/documents/:docId  -> return a presigned GET URL (forces download)
export const getDocumentLink = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Ensure object exists
    try {
      await s3.send(new HeadObjectCommand({ Bucket: doc.bucket, Key: doc.s3Key }));
    } catch {
      return res.status(404).json({ message: 'Object not found in bucket' });
    }

    // Sign for the public host (so Host header matches what the browser requests)
    const publicEndpoint = process.env.PUBLIC_S3_HOST || null;
    const signerClient = publicEndpoint
      ? new S3Client({
          region: config.s3.region || 'us-east-1',
          forcePathStyle: String(config.s3.forcePathStyle).toLowerCase() === 'true',
          endpoint: publicEndpoint, // e.g., http://localhost:9000
          credentials: {
            accessKeyId: config.s3.accessKeyId,
            secretAccessKey: config.s3.secretAccessKey
          }
        })
      : s3;

    // Add response headers so the browser downloads the file
    const cmd = new GetObjectCommand({
      Bucket: doc.bucket,
      Key: doc.s3Key,
      ResponseContentDisposition: `attachment; filename="${doc.fileName}"`,
      // (optional) keep original content type in the response
      ResponseContentType: doc.contentType || 'application/octet-stream'
    });

    const url = await getSignedUrl(signerClient, cmd, { expiresIn: 600 }); // 10 minutes

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

// GET /api/documents/:docId/download  -> stream file to client
export const downloadDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const cmd = new GetObjectCommand({ Bucket: doc.bucket, Key: doc.s3Key });
    const data = await s3.send(cmd); // Body is a readable stream

    res.setHeader('Content-Type', doc.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);

    await pump(data.Body, res);
  } catch (err) {
    console.error('Download error:', err);
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

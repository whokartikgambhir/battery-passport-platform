// external dependencies
import { pipeline } from "stream";
import { promisify } from "util";
import multer from "multer";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// internal dependencies
import { s3 } from "../s3.js";
import { config } from "../config.js";
import { Document } from "../models/documentModel.js";
import { component } from "../logger.js";

const pump = promisify(pipeline);
const log = component("documents");

// Multer: keep file in memory buffer for direct S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB cap
});

/**
 * Middleware to handle file upload via multipart/form-data
 * 
 * @param req request with file under "file" key
 * @returns attaches file buffer to req.file
 */
export const uploadMiddleware = upload.single("file");

/**
 * Method to upload a document to S3 and save metadata in DB
 * 
 * @param req request containing file in req.file
 * @returns response object with document id and metadata
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: 'file is required (multipart/form-data key: "file")' });
    }

    const key = `${Date.now()}_${req.file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      })
    );

    const doc = await Document.create({
      fileName: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      s3Key: key,
      bucket: config.s3.bucket,
      uploadedBy: req.user?.id || null
    });

    log.info("uploaded", { key, by: req.user?.id });
    return res.status(201).json({
      docId: doc._id,
      fileName: doc.fileName,
      createdAt: doc.createdAt
    });
  } catch (err) {
    log.error(err, { step: "upload" });
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Method to generate a presigned URL for downloading a document
 * 
 * @param req request containing document id in params
 * @returns response object with presigned url and metadata
 */
export const getDocumentLink = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    try {
      await s3.send(new HeadObjectCommand({ Bucket: doc.bucket, Key: doc.s3Key }));
    } catch {
      return res.status(404).json({ message: "Object not found in bucket" });
    }

    const publicEndpoint = config.s3.publicHost || null;
    const signerClient = publicEndpoint
      ? new S3Client({
          region: config.s3.region || "us-east-1",
          forcePathStyle: !!config.s3.forcePathStyle,
          endpoint: publicEndpoint,
          credentials: {
            accessKeyId: config.s3.accessKeyId,
            secretAccessKey: config.s3.secretAccessKey
          }
        })
      : s3;

    const cmd = new GetObjectCommand({
      Bucket: doc.bucket,
      Key: doc.s3Key,
      ResponseContentDisposition: `attachment; filename="${doc.fileName}"`,
      ResponseContentType: doc.contentType || "application/octet-stream"
    });

    const url = await getSignedUrl(signerClient, cmd, { expiresIn: 600 }); // 10 minutes
    log.info("presigned", { docId, key: doc.s3Key });

    return res.status(200).json({
      url,
      fileName: doc.fileName,
      contentType: doc.contentType
    });
  } catch (err) {
    log.error(err, { step: "get-link" });
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Method to stream a document directly from S3
 * 
 * @param req request containing document id in params
 * @returns file stream as response
 */
export const downloadDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const cmd = new GetObjectCommand({ Bucket: doc.bucket, Key: doc.s3Key });
    const data = await s3.send(cmd);

    res.setHeader("Content-Type", doc.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.fileName}"`);

    await pump(data.Body, res);
    log.info("downloaded", { docId, key: doc.s3Key });
  } catch (err) {
    log.error(err, { step: "download" });
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Method to update document metadata
 * 
 * @param req request containing document id in params and metadata in body
 * @returns response object with updated document
 */
export const updateDocumentMeta = async (req, res) => {
  try {
    const { docId } = req.params;
    const { fileName } = req.body;

    const update = {};
    if (fileName) update.fileName = fileName;

    const updated = await Document.findByIdAndUpdate(docId, update, { new: true });
    if (!updated) return res.status(404).json({ message: "Document not found" });

    log.info("meta-updated", { docId, fileName: updated.fileName });
    return res.status(200).json(updated);
  } catch (err) {
    log.error(err, { step: "update-meta" });
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Method to delete a document from S3 and DB
 * 
 * @param req request containing document id in params
 * @returns response object with deletion confirmation
 */
export const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    await s3.send(new DeleteObjectCommand({ Bucket: doc.bucket, Key: doc.s3Key }));
    await Document.findByIdAndDelete(docId);

    log.info("deleted", { docId, key: doc.s3Key });
    return res.status(200).json({ message: "Deleted", docId });
  } catch (err) {
    log.error(err, { step: "delete" });
    return res.status(500).json({ message: "Server error" });
  }
};

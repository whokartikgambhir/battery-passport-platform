// external dependencies
import mongoose from 'mongoose';

/**
 * Document schema definition
 * Fields: fileName, contentType, size, s3Key, bucket, uploadedBy
 * 
 * @returns Mongoose Document model
 */
const docSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  contentType: { type: String },
  size: { type: Number },
  s3Key: { type: String, required: true },
  bucket: { type: String, required: true },
  uploadedBy: { type: String }, // user id from token (optional)
}, { timestamps: true });

export const Document = mongoose.model('Document', docSchema);

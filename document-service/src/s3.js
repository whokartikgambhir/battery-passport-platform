import { S3Client } from '@aws-sdk/client-s3';
import { config } from './config.js';

export const s3 = new S3Client({
  region: config.s3.region,
  forcePathStyle: config.s3.forcePathStyle,
  endpoint: config.s3.endpoint,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey
  }
});

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5002,
  mongoUri: process.env.MONGO_URI,

  s3: {
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE).toLowerCase() === 'true',
    publicHost: process.env.PUBLIC_S3_HOST || null
  },

  jwtSecret: process.env.JWT_SECRET
};

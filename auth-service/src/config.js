// external dependencies
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  serviceName: process.env.SERVICE_NAME || "auth",
  logLevel: process.env.LOG_LEVEL || "info",
  internalApiKey: process.env.INTERNAL_API_KEY || ""
};

// external dependencies
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI,
  kafkaBroker: process.env.KAFKA_BROKER || 'kafka:9092',
  authBaseUrl: process.env.AUTH_BASE_URL || 'http://auth-service:5000/api/auth',
  authTimeoutMs: Number(process.env.AUTH_TIMEOUT_MS || 1500),
  serviceName: process.env.SERVICE_NAME || "passport",
  logLevel: process.env.LOG_LEVEL || "info"
};

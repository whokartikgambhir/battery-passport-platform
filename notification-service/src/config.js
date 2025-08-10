import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5003),
  kafkaBroker: process.env.KAFKA_BROKER || "kafka:9092",
  groupId: process.env.KAFKA_GROUP_ID || "notification-service",
  topics: (process.env.TOPICS || "passport.created,passport.updated,passport.deleted")
    .split(",")
    .map(t => t.trim())
    .filter(Boolean),
  redisUrl: process.env.REDIS_URL || "redis://redis:6379",
  mongoUri: process.env.MONGO_URI || "mongodb://mongo:27017/notificationdb",
  mailTo: process.env.MAIL_TO,
  mailFrom: process.env.MAIL_FROM || process.env.MAIL_USER,
  mailUser: process.env.MAIL_USER,
  mailPass: process.env.MAIL_PASS
};

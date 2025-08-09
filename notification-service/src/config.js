import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5003,
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
  groupId: process.env.KAFKA_GROUP_ID || 'notification-service',
  topics: (process.env.TOPICS || '').split(',').map(t => t.trim()).filter(Boolean)
};

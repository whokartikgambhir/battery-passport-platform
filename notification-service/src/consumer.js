import { Kafka } from 'kafkajs';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const startConsumer = async () => {
  const kafka = new Kafka({ clientId: 'notification-service', brokers: [config.kafkaBroker] });
  const consumer = kafka.consumer({ groupId: config.groupId });

  await consumer.connect();
  for (const topic of config.topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
    console.log(`[Kafka] Subscribed to ${topic}`);
  }

  // simple file logger as a "mock email"
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const logFile = path.join(__dirname, '../notifications.log');

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payload = message.value?.toString() || '';
      const line = `${new Date().toISOString()} | ${topic} | ${payload}\n`;
      console.log(`[Kafka] ${topic} ->`, payload);
      fs.appendFile(logFile, line, () => {});
    }
  });

  return consumer;
};

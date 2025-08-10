import { Kafka } from 'kafkajs';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Queue } from 'bullmq'; // ⬅️ NEW

const emailQueue = new Queue('emailQueue', {
  connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' }
});

// Map Kafka topics to email job payload and enqueue
const handleKafkaEvent = async (topic, raw) => {
  let parsed = {};
  try { parsed = JSON.parse(raw); } catch { /* ignore parse errors */ }

  let type = null;
  if (topic === 'passport.created') type = 'created';
  if (topic === 'passport.updated') type = 'updated';
  if (topic === 'passport.deleted') type = 'deleted';

  if (!type) return;

  await emailQueue.add('send-email', {
    to: process.env.MAIL_TO,       // or derive recipient from parsed payload if you prefer
    type,
    passportId: parsed.id,
    payload: parsed.data
  });

  console.log(`[Producer] Enqueued ${type} email for passport ${parsed.id}`);
};

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

      try {
        await handleKafkaEvent(topic, payload);
      } catch (err) {
        console.error('[Producer] Failed to enqueue email job:', err.message);
      }
    }
  });

  return consumer;
};

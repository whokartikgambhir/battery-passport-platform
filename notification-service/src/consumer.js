// external dependencies
import { Kafka } from 'kafkajs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Queue } from 'bullmq';

// internal dependencies
import { config } from './config.js';

const emailQueue = new Queue('emailQueue', {
  connection: { url: config.redisUrl }
});

const handleKafkaEvent = async (topic, raw) => {
  let parsed = {};
  try { parsed = JSON.parse(raw); } catch {}

  let type = null;
  if (topic === 'passport.created') type = 'created';
  if (topic === 'passport.updated') type = 'updated';
  if (topic === 'passport.deleted') type = 'deleted';
  if (!type) return;

  // enqueue job — recipients will be resolved in the worker (admins by default)
  await emailQueue.add('send-email', {
    type,
    passportId: parsed.id,
    payload: parsed.data,
    // Optional: include specific target users if you want
    // userIds: parsed.userIds,  // e.g., producer can send owners
    // emails: parsed.emails
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

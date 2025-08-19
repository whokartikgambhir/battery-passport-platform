// external dependencies
import { Kafka } from "kafkajs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Queue } from "bullmq";

// internal dependencies
import { config } from "./config.js";
import { component } from "./logger.js";

const klog = component("kafka");
const qlog = component("queue");

const emailQueue = new Queue("emailQueue", {
  connection: { url: config.redisUrl }
});

/**
 * Method to handle incoming Kafka events
 * Parses payload and enqueues email jobs in BullMQ
 * 
 * @param topic kafka topic name
 * @param raw raw message payload string
 * @returns void
 */
const handleKafkaEvent = async (topic, raw) => {
  let parsed = {};
  try { parsed = JSON.parse(raw); } catch { klog.warn("payload parse failed", { raw }); }

  let type = null;
  if (topic === "passport.created") type = "created";
  if (topic === "passport.updated") type = "updated";
  if (topic === "passport.deleted") type = "deleted";
  if (!type) return;

  await emailQueue.add("send-email", {
    type,
    passportId: parsed.id,
    payload: parsed.data
    // optionally: userIds / emails
  });

  qlog.info("enqueued email", { type, passportId: parsed.id });
};

/**
 * Method to start Kafka consumer
 * Subscribes to topics, logs events, and enqueues jobs
 * 
 * @returns kafka consumer instance
 */
export const startConsumer = async () => {
  const kafka = new Kafka({ clientId: "notification-service", brokers: [config.kafkaBroker] });
  const consumer = kafka.consumer({ groupId: config.groupId });

  await consumer.connect();
  for (const topic of config.topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
    klog.info("subscribed", { topic });
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const logFile = path.join(__dirname, "../notifications.log");

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payload = message.value?.toString() || "";
      const line = `${new Date().toISOString()} | ${topic} | ${payload}\n`;

      klog.info("event", { topic, payload });
      fs.appendFile(logFile, line, (e) => { if (e) klog.warn("file log failed", { error: e.message }); });

      try {
        await handleKafkaEvent(topic, payload);
      } catch (err) {
        qlog.error(err, { step: "enqueue", topic });
      }
    }
  });

  return consumer;
};

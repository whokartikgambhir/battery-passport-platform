// external dependencies
import { Kafka } from "kafkajs";

// internal dependencies
import { config } from "../config.js";
import { component } from "../logger.js";

let producer;
const klog = component("kafka");

/**
 * Method to get or create a Kafka producer
 * Connects lazily on first call
 * 
 * @returns Kafka producer instance
 */
export const getProducer = async () => {
  if (producer) return producer;
  const kafka = new Kafka({ clientId: "passport-service", brokers: [config.kafkaBroker] });
  producer = kafka.producer();
  await producer.connect();
  klog.info("producer connected");
  return producer;
};

/**
 * Method to emit an event to a Kafka topic
 * 
 * @param topic Kafka topic name
 * @param payload event payload object
 * @returns void
 */
export const emitEvent = async (topic, payload) => {
  try {
    const p = await getProducer();
    await p.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
    klog.info("event sent", { topic, key: payload?.id });
  } catch (err) {
    klog.error(err, { step: "emit", topic });
  }
};

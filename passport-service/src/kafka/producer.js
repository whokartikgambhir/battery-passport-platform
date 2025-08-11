// external dependencies
import { Kafka } from "kafkajs";

// internal dependencies
import { config } from "../config.js";
import { component } from "../logger.js";

let producer;
const klog = component("kafka");

export const getProducer = async () => {
  if (producer) return producer;
  const kafka = new Kafka({ clientId: "passport-service", brokers: [config.kafkaBroker] });
  producer = kafka.producer();
  await producer.connect();
  klog.info("producer connected");
  return producer;
};

export const emitEvent = async (topic, payload) => {
  try {
    const p = await getProducer();
    await p.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
    klog.info("event sent", { topic, key: payload?.id });
  } catch (err) {
    klog.error(err, { step: "emit", topic });
  }
};

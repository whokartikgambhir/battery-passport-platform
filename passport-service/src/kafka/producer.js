import { Kafka } from 'kafkajs';
import { config } from '../config.js';

let producer;
export const getProducer = async () => {
  if (producer) return producer;
  const kafka = new Kafka({ clientId: 'passport-service', brokers: [config.kafkaBroker] });
  producer = kafka.producer();
  await producer.connect();
  return producer;
};

export const emitEvent = async (topic, payload) => {
  try {
    const p = await getProducer();
    await p.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
  } catch (err) {
    console.error('Kafka emit error:', err.message);
  }
};

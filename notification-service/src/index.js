import express from 'express';
import { config } from './config.js';
import { startConsumer } from './consumer.js';

const app = express();

app.get('/', (_req, res) => res.send('Notification Service Running'));

let consumerReady = false;
app.get('/ready', (_req, res) => {
  if (consumerReady) return res.status(200).send('ready');
  return res.status(503).send('starting');
});

const server = app.listen(config.port, () =>
  console.log(`Notification Service on ${config.port}`)
);

// retry wrapper
const startConsumerWithRetry = async () => {
  const base = 2000;     // 2s
  const max = 15000;     // 15s
  let attempt = 0;

  while (true) {
    try {
      await startConsumer();
      consumerReady = true;
      console.log('Kafka consumer connected ✅');
      break; // connected, exit loop
    } catch (err) {
      attempt += 1;
      const delay = Math.min(base * Math.pow(1.5, attempt - 1), max);
      console.error(
        `Kafka consumer error (attempt ${attempt}). Retrying in ${Math.round(delay/1000)}s...`,
        err.message
      );
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

startConsumerWithRetry();

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down...`);
  try {
    server && server.close();
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

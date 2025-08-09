import express from 'express';
import { config } from './config.js';
import { startConsumer } from './consumer.js';

const app = express();
app.get('/', (_req, res) => res.send('Notification Service Running'));
app.listen(config.port, () => console.log(`Notification Service on ${config.port}`));

startConsumer().catch(err => {
  console.error('Kafka consumer error:', err);
  process.exit(1);
});

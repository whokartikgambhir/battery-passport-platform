import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import routes from './routes/documentRoute.js';

const app = express();
app.use(express.json());
app.use('/api/documents', routes);

mongoose.connect(config.mongoUri, { dbName: 'documentdb' })
  .then(() => {
    console.log('Document DB connected');
    app.listen(config.port, () => console.log(`Document Service running on ${config.port}`));
  })
  .catch(err => console.error('Mongo error:', err));

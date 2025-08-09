import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import passportRoutes from './routes/passportRoute.js';

const app = express();
app.use(express.json());

app.use('/api/passports', passportRoutes);

mongoose.connect(config.mongoUri, { dbName: 'passportdb' })
  .then(() => {
    console.log('Passport DB connected');
    app.listen(config.port, () => {
      console.log(`Passport Service running on port ${config.port}`);
    });
  })
  .catch(err => console.error('DB connection error:', err));

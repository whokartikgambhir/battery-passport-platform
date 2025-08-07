import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import { config } from './config.js';

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);

const PORT = config.port || 5000;

mongoose.connect(config.mongoUri, { dbName: 'authdb' })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB error:', err));

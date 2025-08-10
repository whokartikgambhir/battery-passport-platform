// external dependencies
import express from 'express';
import mongoose from 'mongoose';

// internal dependencies
import authRoutes from './routes/authRoutes.js';
import internalRoute from "./routes/internalRoute.js";
import { config } from './config.js';

const app = express();
app.use(express.json());
app.use("/internal", internalRoute);
app.use('/api/auth', authRoutes);

const PORT = config.port || 5000;

const connectWithRetry = () => {
  console.log('Attempting MongoDB connection for Auth Service...');
  mongoose.connect(config.mongoUri, { 
    dbName: 'authdb',
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => 
        console.log(`Auth Service running on port ${PORT}`)
      );
    })
    .catch((err) => {
      console.error('Mongo connection failed, retrying in 5s...', err.message);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

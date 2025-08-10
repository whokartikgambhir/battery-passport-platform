import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import passportRoutes from './routes/passportRoute.js';
import internalRoute from "./routes/internalRoute.js";

const app = express();
app.use(express.json());

app.use("/internal", internalRoute);
app.use('/api/passports', passportRoutes);

const connectWithRetry = () => {
  console.log('Attempting MongoDB connection for Passport Service...');
  mongoose.connect(config.mongoUri, { 
    dbName: 'passportdb',
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => {
      console.log('Passport DB connected');
      app.listen(config.port, () => {
        console.log(`Passport Service running on port ${config.port}`);
      });
    })
    .catch((err) => {
      console.error('DB connection failed, retrying in 5s...', err.message);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

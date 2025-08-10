import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import routes from './routes/documentRoute.js';

const app = express();
app.use(express.json());
app.use('/api/documents', routes);

const connectWithRetry = () => {
  console.log('Attempting MongoDB connection...');
  mongoose.connect(config.mongoUri, { 
    dbName: 'documentdb',
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
    .then(() => {
      console.log('Document DB connected');
      app.listen(config.port, () => 
        console.log(`Document Service running on ${config.port}`)
      );
    })
    .catch((err) => {
      console.error('Mongo connection failed, retrying in 5s...', err.message);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

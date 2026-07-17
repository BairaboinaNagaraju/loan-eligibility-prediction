import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 4001;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8002';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Express Backend Bridge' });
});

// Proxy prediction request
app.post('/api/predict', async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, req.body, { timeout: 10000 });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error contacting ML service:', error.message);
    res.status(502).json({
      success: false,
      message: 'Failed to contact the underlying AI engine. Ensure Python service is running.',
      error: error.message
    });
  }
});

// Proxy model stats request
app.get('/api/model-info', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/model-info`, { timeout: 5000 });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error getting model info:', error.message);
    res.status(502).json({
      success: false,
      message: 'Failed to retrieve AI model information.',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

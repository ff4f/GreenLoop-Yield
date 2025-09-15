import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes handler
app.use('/api', async (req, res) => {
  try {
    const apiPath = req.path.replace('/api/', '');
    const handlerPath = path.join(__dirname, 'api', apiPath + '.ts');
    const handlerPathJs = path.join(__dirname, 'api', apiPath + '.js');
    
    let handlerFile = null;
    if (fs.existsSync(handlerPath)) {
      handlerFile = handlerPath;
    } else if (fs.existsSync(handlerPathJs)) {
      handlerFile = handlerPathJs;
    }
    
    if (handlerFile) {
      const handler = await import(handlerFile);
      if (handler.default) {
        await handler.default(req, res);
      } else {
        res.status(500).json({ error: 'Invalid API handler' });
      }
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📍 API endpoints available at http://localhost:${PORT}/api/*`);
});

export default app;
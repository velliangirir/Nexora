import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db/database';
import { seedDemoData } from './db/seed';
import authRoutes from './routes/auth';
import decisionRoutes from './routes/decisions';
import simulationRoutes from './routes/simulations';
import realityRoutes from './routes/reality';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware & Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/reality-checks', realityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NEXORA AI Backend', timestamp: new Date().toISOString() });
});

// API 404 Fallback — Guaranteed JSON
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `API route ${req.originalUrl} not found` });
});

// Serve frontend static files in production if built
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res) => {
  const indexPath = path.join(frontendDist, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('NEXORA AI Backend API is running on port ' + PORT);
  }
});

// Initialize database, seed demo data & start server
async function startServer() {
  await initDatabase();
  await seedDemoData();

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n=======================================================`);
    printHostUrl(PORT);
    console.log(`=======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

function printHostUrl(port: number | string) {
  console.log(`🚀 NEXORA AI Server running at: http://localhost:${port}`);
}

export default app;

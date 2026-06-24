import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Database
import { initializeDatabase } from './db/schema.js';
import { seedDatabase } from './db/seed.js';

// Routes
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';
import playerRoutes from './routes/players.js';
import tournamentRoutes from './routes/tournaments.js';
import registrationRoutes from './routes/registrations.js';
import matchRoutes from './routes/matches.js';
import leaderboardRoutes from './routes/leaderboards.js';
import certificateRoutes from './routes/certificates.js';
import announcementRoutes from './routes/announcements.js';
import settingsRoutes from './routes/settings.js';
import pointsRoutes from './routes/points.js';
import statsRoutes from './routes/stats.js';
import sseRoutes from './routes/sse.js';
import hallOfFameRoutes from './routes/hallOfFame.js';
import backupRoutes from './routes/backups.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://bhima-esports.vercel.app'
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/events', sseRoutes);
app.use('/api/hall-of-fame', hallOfFameRoutes);
app.use('/api/backups', backupRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
  }

  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Initialize & Start ──────────────────────────────────────────────────────
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Seed data
    await seedDatabase();
    console.log('✅ Seed data loaded');

    // Automatic backup checks (Daily / Weekly)
    try {
      const { createDbBackup } = await import('./routes/backups.js');
      const BACKUPS_DIR = path.join(__dirname, 'db/backups');
      if (!fs.existsSync(BACKUPS_DIR)) {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
      }
      
      const files = fs.readdirSync(BACKUPS_DIR);
      
      // Daily check: if no backup starting with 'db-backup-daily-' created in last 24h
      const dailyBackups = files.filter(f => f.startsWith('db-backup-daily-'));
      let needsDaily = true;
      const oneDayMs = 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      for (const file of dailyBackups) {
        const stats = fs.statSync(path.join(BACKUPS_DIR, file));
        if (now - stats.mtimeMs < oneDayMs) {
          needsDaily = false;
          break;
        }
      }
      
      if (needsDaily) {
        createDbBackup('daily');
      }

      // Weekly check: if no backup starting with 'db-backup-weekly-' created in last 7 days
      const weeklyBackups = files.filter(f => f.startsWith('db-backup-weekly-'));
      let needsWeekly = true;
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      
      for (const file of weeklyBackups) {
        const stats = fs.statSync(path.join(BACKUPS_DIR, file));
        if (now - stats.mtimeMs < oneWeekMs) {
          needsWeekly = false;
          break;
        }
      }
      
      if (needsWeekly) {
        createDbBackup('weekly');
      }
    } catch (e) {
      console.error('Failed to run automatic startup backups:', e);
    }

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║         BHIMA ESPORTS Backend Server        ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  🚀 Server running on port ${PORT}             ║`);
      console.log(`║  📡 API: http://localhost:${PORT}/api           ║`);
      console.log('║  🎮 Game: Free Fire                         ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;

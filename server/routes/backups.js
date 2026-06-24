import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticate } from '../middleware/auth.js';
import { restoreDatabase } from '../db/schema.js';
import { broadcastEvent } from './sse.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_FILE_PATH = path.join(__dirname, '../db/bhima_esports.sqlite');
const BACKUPS_DIR = path.join(__dirname, '../db/backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Helper to trigger backup
export function createDbBackup(type = 'manual') {
  if (!fs.existsSync(DB_FILE_PATH)) {
    throw new Error('Active database file not found.');
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  const backupFileName = `db-backup-${type}-${timestamp}.sqlite`;
  const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

  fs.copyFileSync(DB_FILE_PATH, backupFilePath);
  console.log(`✅ Created ${type} database backup: ${backupFileName}`);
  return { filename: backupFileName, filepath: backupFilePath };
}

// GET /api/backups - list all backups (admin only)
router.get('/', authenticate, (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(BACKUPS_DIR);
    const backups = files
      .filter(file => file.endsWith('.sqlite'))
      .map(file => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        
        let type = 'manual';
        if (file.includes('-daily-')) type = 'daily';
        else if (file.includes('-weekly-')) type = 'weekly';

        return {
          filename: file,
          size: stats.size,
          created_at: stats.mtime.toISOString(),
          type,
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ backups });
  } catch (err) {
    console.error('List backups error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/backups - trigger manual database backup (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    const backup = createDbBackup('manual');

    // Create log entry
    const db = restoreDatabase; // just dummy reference to check if we can log
    const { getDb } = await import('../db/schema.js');
    const logDb = getDb();
    logDb.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'CREATE_BACKUP', `Manually created database backup: ${backup.filename}`, req.ip]
    );

    res.status(201).json({ message: 'Backup created successfully.', filename: backup.filename });
  } catch (err) {
    console.error('Create backup error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// POST /api/backups/restore - restore database from backup file (admin only)
router.post('/restore', authenticate, async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'filename is required.' });
    }

    const backupFilePath = path.join(BACKUPS_DIR, filename);

    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({ error: 'Backup file not found.' });
    }

    // 1. Create a safety backup of current database first!
    createDbBackup('pre-restore-safety');

    // 2. Perform restore
    await restoreDatabase(backupFilePath);

    // Log the action in the new database instance!
    const { getDb } = await import('../db/schema.js');
    const logDb = getDb();
    logDb.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'RESTORE_DB', `Restored database from backup: ${filename}`, req.ip]
    );

    // 3. Broadcast to all users to trigger re-fetches
    broadcastEvent('leaderboard_updated', {});
    broadcastEvent('announcement', { title: 'Database Restored', content: 'The system database has been restored from backup.' });

    res.json({ message: 'Database successfully restored from backup.' });
  } catch (err) {
    console.error('Restore database error:', err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// DELETE /api/backups/:filename - delete backup file (admin only)
router.delete('/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupFilePath = path.join(BACKUPS_DIR, filename);

    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({ error: 'Backup file not found.' });
    }

    fs.unlinkSync(backupFilePath);

    const { getDb } = await import('../db/schema.js');
    const logDb = getDb();
    logDb.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'DELETE_BACKUP', `Deleted database backup file: ${filename}`, req.ip]
    );

    res.json({ message: 'Backup file deleted successfully.' });
  } catch (err) {
    console.error('Delete backup error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

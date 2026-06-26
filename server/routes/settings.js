import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/settings - get all settings (public)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.all('SELECT key, value FROM settings');

    // Convert array to key-value object
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/settings - update settings (admin)
router.put('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required.' });
    }

    try {
      for (const [key, value] of Object.entries(settings)) {
        const existing = db.get('SELECT id FROM settings WHERE key = ?', [key]);
        if (existing) {
          db.run('UPDATE settings SET value = ? WHERE key = ?', [String(value), key]);
        } else {
          db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
        }
      }
    } catch (err) {
      throw err;
    }

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.admin.admin_id,
        'UPDATE_SETTINGS',
        `Updated settings: ${Object.keys(settings).join(', ')}`,
        req.ip,
      ]
    );

    // Return updated settings
    const rows = db.all('SELECT key, value FROM settings');
    const updatedSettings = {};
    for (const row of rows) {
      updatedSettings[row.key] = row.value;
    }

    broadcastEvent('settings', updatedSettings);

    res.json({ message: 'Settings updated.', settings: updatedSettings });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

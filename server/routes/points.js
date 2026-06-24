import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/points - get point distribution
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const row = db.get('SELECT * FROM point_distributions ORDER BY id DESC LIMIT 1');

    if (!row) {
      return res.json({ point_distribution: null });
    }

    res.json({
      point_distribution: {
        id: row.id,
        title: row.title,
        data: JSON.parse(row.data),
        updated_at: row.updated_at,
      },
    });
  } catch (err) {
    console.error('Get points error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/points - update point distribution (admin)
router.put('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { title, data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Point distribution data is required.' });
    }

    // Validate data structure
    const pointData = typeof data === 'string' ? JSON.parse(data) : data;
    if (!pointData.kill_point_value || !pointData.placements || !Array.isArray(pointData.placements)) {
      return res.status(400).json({
        error: 'Data must include kill_point_value and placements array.',
      });
    }

    const existing = db.get('SELECT id FROM point_distributions ORDER BY id DESC LIMIT 1');
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

    if (existing) {
      db.run(
        "UPDATE point_distributions SET title = ?, data = ?, updated_at = datetime('now') WHERE id = ?",
        [title || 'Custom Points', dataStr, existing.id]
      );
    } else {
      db.run(
        'INSERT INTO point_distributions (title, data) VALUES (?, ?)',
        [title || 'Custom Points', dataStr]
      );
    }

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'UPDATE_POINTS', 'Point distribution updated', req.ip]
    );

    const row = db.get('SELECT * FROM point_distributions ORDER BY id DESC LIMIT 1');
    res.json({
      message: 'Point distribution updated.',
      point_distribution: {
        id: row.id,
        title: row.title,
        data: JSON.parse(row.data),
        updated_at: row.updated_at,
      },
    });
  } catch (err) {
    console.error('Update points error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

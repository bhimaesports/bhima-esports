import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/announcements - list active announcements (public)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { all: showAll, page = 1, limit = 20 } = req.query;

    let sql = 'SELECT * FROM announcements';
    const params = [];

    // By default, only show active announcements; admin can request all
    if (showAll !== 'true') {
      sql += ' WHERE is_active = 1';
    }

    const countSql = (showAll !== 'true')
      ? 'SELECT COUNT(*) as total FROM announcements WHERE is_active = 1'
      : 'SELECT COUNT(*) as total FROM announcements';
    const total = db.get(countSql)?.total || 0;

    sql += ' ORDER BY is_pinned DESC, created_at DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const announcements = db.all(sql, params);

    res.json({
      announcements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get announcements error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/announcements - create announcement (admin)
router.post('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { title, content, type, is_pinned } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    db.run(
      `INSERT INTO announcements (title, content, type, is_pinned)
       VALUES (?, ?, ?, ?)`,
      [title, content || null, type || 'info', is_pinned ? 1 : 0]
    );

    const id = db.getLastInsertRowId();
    const announcement = db.get('SELECT * FROM announcements WHERE id = ?', [id]);

    // Broadcast to SSE clients
    broadcastEvent('new_announcement', announcement);

    res.status(201).json({ message: 'Announcement created.', announcement });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/announcements/:id - update announcement (admin)
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const announcement = db.get('SELECT * FROM announcements WHERE id = ?', [Number(id)]);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    const { title, content, type, is_pinned, is_active } = req.body;

    db.run(
      `UPDATE announcements SET
         title = ?, content = ?, type = ?, is_pinned = ?, is_active = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
      [
        title || announcement.title,
        content ?? announcement.content,
        type || announcement.type,
        is_pinned !== undefined ? (is_pinned ? 1 : 0) : announcement.is_pinned,
        is_active !== undefined ? (is_active ? 1 : 0) : announcement.is_active,
        Number(id),
      ]
    );

    const updated = db.get('SELECT * FROM announcements WHERE id = ?', [Number(id)]);
    res.json({ message: 'Announcement updated.', announcement: updated });
  } catch (err) {
    console.error('Update announcement error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/announcements/:id - delete announcement (admin)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const announcement = db.get('SELECT * FROM announcements WHERE id = ?', [Number(id)]);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    db.run('DELETE FROM announcements WHERE id = ?', [Number(id)]);

    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/tournaments - list tournaments with optional filters
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status, search, page = 1, limit = 20 } = req.query;

    let sql = 'SELECT * FROM tournaments WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const total = db.get(countSql, params)?.total || 0;

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const tournaments = db.all(sql, params);

    res.json({
      tournaments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get tournaments error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/tournaments - create tournament (admin)
router.post('/', authenticate, upload.single('poster'), (req, res) => {
  try {
    const db = getDb();
    const {
      name, date, time, registration_deadline, team_slots,
      status, rules, prize_details, mode,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tournament name is required.' });
    }

    const poster_url = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
      `INSERT INTO tournaments (name, poster_url, date, time, registration_deadline,
                                team_slots, status, rules, prize_details, mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        poster_url,
        date || null,
        time || null,
        registration_deadline || null,
        team_slots ? Number(team_slots) : 20,
        status || 'draft',
        rules || null,
        prize_details || null,
        mode || 'br',
      ]
    );

    const id = db.getLastInsertRowId();
    const tournament = db.get('SELECT * FROM tournaments WHERE id = ?', [id]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'CREATE_TOURNAMENT', `Created tournament: ${name}`, req.ip]
    );

    broadcastEvent('entity_update', { entity: 'tournaments' });

    res.status(201).json({ message: 'Tournament created successfully.', tournament });
  } catch (err) {
    console.error('Create tournament error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/tournaments/:id - update tournament (admin)
router.put('/:id', authenticate, upload.single('poster'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const tournament = db.get('SELECT * FROM tournaments WHERE id = ?', [Number(id)]);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    const {
      name, date, time, registration_deadline, team_slots,
      rules, prize_details, mode,
    } = req.body;

    const poster_url = req.file ? `/uploads/${req.file.filename}` : tournament.poster_url;

    db.run(
      `UPDATE tournaments SET
         name = ?, poster_url = ?, date = ?, time = ?, registration_deadline = ?,
         team_slots = ?, rules = ?, prize_details = ?, mode = ?
       WHERE id = ?`,
      [
        name || tournament.name,
        poster_url,
        date ?? tournament.date,
        time ?? tournament.time,
        registration_deadline ?? tournament.registration_deadline,
        team_slots ? Number(team_slots) : tournament.team_slots,
        rules ?? tournament.rules,
        prize_details ?? tournament.prize_details,
        mode || tournament.mode,
        Number(id),
      ]
    );

    const updated = db.get('SELECT * FROM tournaments WHERE id = ?', [Number(id)]);
    
    broadcastEvent('entity_update', { entity: 'tournaments' });
    
    res.json({ message: 'Tournament updated successfully.', tournament: updated });
  } catch (err) {
    console.error('Update tournament error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/tournaments/:id - delete tournament (admin)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const tournament = db.get('SELECT * FROM tournaments WHERE id = ?', [Number(id)]);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    // Delete associated matches and results
    const matches = db.all('SELECT id FROM matches WHERE tournament_id = ?', [Number(id)]);
    for (const m of matches) {
      db.run('DELETE FROM results WHERE match_id = ?', [m.id]);
    }
    db.run('DELETE FROM matches WHERE tournament_id = ?', [Number(id)]);
    db.run('DELETE FROM registrations WHERE tournament_id = ?', [Number(id)]);
    db.run('DELETE FROM tournaments WHERE id = ?', [Number(id)]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'DELETE_TOURNAMENT', `Deleted tournament: ${tournament.name}`, req.ip]
    );

    broadcastEvent('entity_update', { entity: 'tournaments' });

    res.json({ message: 'Tournament deleted successfully.' });
  } catch (err) {
    console.error('Delete tournament error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/tournaments/:id/status - change tournament status
router.patch('/:id/status', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'open', 'live', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Valid status (${validStatuses.join('/')}) is required.`,
      });
    }

    const tournament = db.get('SELECT * FROM tournaments WHERE id = ?', [Number(id)]);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    db.run('UPDATE tournaments SET status = ? WHERE id = ?', [status, Number(id)]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.admin.admin_id,
        'TOURNAMENT_STATUS_CHANGE',
        `Tournament "${tournament.name}" status -> ${status}`,
        req.ip,
      ]
    );

    const updated = db.get('SELECT * FROM tournaments WHERE id = ?', [Number(id)]);
    
    broadcastEvent('entity_update', { entity: 'tournaments' });
    
    res.json({ message: `Tournament status updated to ${status}.`, tournament: updated });
  } catch (err) {
    console.error('Tournament status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

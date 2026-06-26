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
router.post('/', authenticate, upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'banner', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
  try {
    const db = getDb();
    const { name, date, time, registration_deadline, team_slots, status, rules, mode, prize_pool, maps, match_format, prize_details } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const poster_url = req.files?.poster ? `/uploads/${req.files.poster[0].filename}` : null;
    const banner_url = req.files?.banner ? `/uploads/${req.files.banner[0].filename}` : null;
    const cover_image = req.files?.cover ? `/uploads/${req.files.cover[0].filename}` : null;

    db.run(
      `INSERT INTO tournaments (
        name, poster_url, banner_url, cover_image, date, time, 
        registration_deadline, team_slots, status, rules, mode, prize_pool, maps, match_format, prize_details
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, poster_url, banner_url, cover_image, date || null, time || null,
        registration_deadline || null, team_slots ? Number(team_slots) : 20,
        status || 'draft', rules || null, mode || 'br', prize_pool || null, maps || null, match_format || null, prize_details || null
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
router.put('/:id', authenticate, upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'banner', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const tournament = db.get('SELECT * FROM tournaments WHERE id = ?', [Number(id)]);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    const { name, date, time, registration_deadline, team_slots, rules, mode, status, prize_pool, maps, match_format, prize_details } = req.body;

    const poster_url = req.files?.poster ? `/uploads/${req.files.poster[0].filename}` : tournament.poster_url;
    const banner_url = req.files?.banner ? `/uploads/${req.files.banner[0].filename}` : tournament.banner_url;
    const cover_image = req.files?.cover ? `/uploads/${req.files.cover[0].filename}` : tournament.cover_image;

    db.run(
      `UPDATE tournaments SET
         name = ?, poster_url = ?, banner_url = ?, cover_image = ?, date = ?, time = ?,
         registration_deadline = ?, team_slots = ?, rules = ?, mode = ?, status = ?,
         prize_pool = ?, maps = ?, match_format = ?, prize_details = ?
       WHERE id = ?`,
      [
        name || tournament.name,
        poster_url,
        banner_url,
        cover_image,
        date !== undefined ? date : tournament.date,
        time !== undefined ? time : tournament.time,
        registration_deadline !== undefined ? registration_deadline : tournament.registration_deadline,
        team_slots !== undefined ? Number(team_slots) : tournament.team_slots,
        rules !== undefined ? rules : tournament.rules,
        mode || tournament.mode,
        status || tournament.status,
        prize_pool !== undefined ? prize_pool : tournament.prize_pool,
        maps !== undefined ? maps : tournament.maps,
        match_format !== undefined ? match_format : tournament.match_format,
        prize_details !== undefined ? prize_details : tournament.prize_details,
        Number(id)
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

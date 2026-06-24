import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/hall-of-fame - list all hall of fame entries (public)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const sql = `
      SELECT 
        hf.*,
        t.name as team_name,
        t.logo_url as team_logo,
        t.motto as team_motto,
        td.code as team_dept_code,
        p.name as player_name,
        p.uid as player_uid,
        pd.code as player_dept_code
      FROM hall_of_fame hf
      LEFT JOIN teams t ON hf.team_id = t.id
      LEFT JOIN departments td ON t.department_id = td.id
      LEFT JOIN players p ON hf.player_id = p.id
      LEFT JOIN departments pd ON p.department_id = pd.id
      ORDER BY hf.id DESC
    `;
    const entries = db.all(sql);
    res.json({ entries });
  } catch (err) {
    console.error('Get Hall of Fame error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/hall-of-fame - create an entry (admin)
router.post('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { game, reason, type, team_id, player_id } = req.body;

    if (!game || !reason || !type) {
      return res.status(400).json({ error: 'Game, reason, and type are required.' });
    }

    if (type !== 'team' && type !== 'player') {
      return res.status(400).json({ error: 'Type must be either team or player.' });
    }

    if (type === 'team' && !team_id) {
      return res.status(400).json({ error: 'Team is required when type is team.' });
    }

    if (type === 'player' && !player_id) {
      return res.status(400).json({ error: 'Player is required when type is player.' });
    }

    db.run(
      `INSERT INTO hall_of_fame (game, reason, type, team_id, player_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        game,
        reason,
        type,
        type === 'team' ? Number(team_id) : null,
        type === 'player' ? Number(player_id) : null
      ]
    );

    const id = db.getLastInsertRowId();

    // Log the admin action
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.admin.admin_id,
        'ADD_HALL_OF_FAME',
        `Added Hall of Fame entry (ID: ${id}) for ${type}: ${type === 'team' ? team_id : player_id}`,
        req.ip,
      ]
    );

    // Fetch the inserted entry with joined data
    const sql = `
      SELECT 
        hf.*,
        t.name as team_name,
        t.logo_url as team_logo,
        t.motto as team_motto,
        td.code as team_dept_code,
        p.name as player_name,
        p.uid as player_uid,
        pd.code as player_dept_code
      FROM hall_of_fame hf
      LEFT JOIN teams t ON hf.team_id = t.id
      LEFT JOIN departments td ON t.department_id = td.id
      LEFT JOIN players p ON hf.player_id = p.id
      LEFT JOIN departments pd ON p.department_id = pd.id
      WHERE hf.id = ?
    `;
    const entry = db.get(sql, [id]);

    // Broadcast update
    broadcastEvent('hall-of-fame-update', { action: 'create', entry });

    res.status(201).json({ message: 'Hall of Fame entry added.', entry });
  } catch (err) {
    console.error('Create Hall of Fame error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/hall-of-fame/:id - update an entry (admin)
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { game, reason, type, team_id, player_id } = req.body;

    const existing = db.get('SELECT * FROM hall_of_fame WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ error: 'Hall of Fame entry not found.' });
    }

    if (!game || !reason || !type) {
      return res.status(400).json({ error: 'Game, reason, and type are required.' });
    }

    if (type !== 'team' && type !== 'player') {
      return res.status(400).json({ error: 'Type must be either team or player.' });
    }

    if (type === 'team' && !team_id) {
      return res.status(400).json({ error: 'Team is required when type is team.' });
    }

    if (type === 'player' && !player_id) {
      return res.status(400).json({ error: 'Player is required when type is player.' });
    }

    db.run(
      `UPDATE hall_of_fame 
       SET game = ?, reason = ?, type = ?, team_id = ?, player_id = ?
       WHERE id = ?`,
      [
        game,
        reason,
        type,
        type === 'team' ? Number(team_id) : null,
        type === 'player' ? Number(player_id) : null,
        Number(id)
      ]
    );

    // Log the admin action
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.admin.admin_id,
        'UPDATE_HALL_OF_FAME',
        `Updated Hall of Fame entry (ID: ${id})`,
        req.ip,
      ]
    );

    // Fetch the updated entry
    const sql = `
      SELECT 
        hf.*,
        t.name as team_name,
        t.logo_url as team_logo,
        t.motto as team_motto,
        td.code as team_dept_code,
        p.name as player_name,
        p.uid as player_uid,
        pd.code as player_dept_code
      FROM hall_of_fame hf
      LEFT JOIN teams t ON hf.team_id = t.id
      LEFT JOIN departments td ON t.department_id = td.id
      LEFT JOIN players p ON hf.player_id = p.id
      LEFT JOIN departments pd ON p.department_id = pd.id
      WHERE hf.id = ?
    `;
    const entry = db.get(sql, [Number(id)]);

    // Broadcast update
    broadcastEvent('hall-of-fame-update', { action: 'update', entry });

    res.json({ message: 'Hall of Fame entry updated.', entry });
  } catch (err) {
    console.error('Update Hall of Fame error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/hall-of-fame/:id - delete an entry (admin)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.get('SELECT * FROM hall_of_fame WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ error: 'Hall of Fame entry not found.' });
    }

    db.run('DELETE FROM hall_of_fame WHERE id = ?', [Number(id)]);

    // Log the admin action
    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.admin.admin_id,
        'DELETE_HALL_OF_FAME',
        `Deleted Hall of Fame entry (ID: ${id})`,
        req.ip,
      ]
    );

    // Broadcast update
    broadcastEvent('hall-of-fame-update', { action: 'delete', id: Number(id) });

    res.json({ message: 'Hall of Fame entry deleted.' });
  } catch (err) {
    console.error('Delete Hall of Fame error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

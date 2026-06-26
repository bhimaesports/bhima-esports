import express from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { broadcastEvent } from './sse.js';

const router = express.Router();

// GET all achievements
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.all(`
      SELECT a.*, p.name as player_name, t.name as team_name 
      FROM achievements a 
      JOIN players p ON a.player_id = p.id
      LEFT JOIN teams t ON p.team_id = t.id
      ORDER BY a.issued_date DESC
    `);
    res.json({ achievements: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET achievements for a specific player
router.get('/player/:id', (req, res) => {
  try {
    const db = getDb();
    const rows = db.all(`
      SELECT * FROM achievements WHERE player_id = ? ORDER BY issued_date DESC
    `, [req.params.id]);
    res.json({ achievements: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new achievement (Admin only)
router.post('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { player_id, title, award_type, tournament_name, issued_date, pdf_path } = req.body;
    
    if (!player_id || !title || !award_type) {
      return res.status(400).json({ error: 'player_id, title, and award_type are required.' });
    }

    // Generate unique achievement code
    const uuid = require('crypto').randomUUID();
    const shortUuid = uuid.split('-')[0].toUpperCase();
    const achievement_code = `BHIMA-ACHV-${new Date().getFullYear()}-${shortUuid}`;

    db.run(`
      INSERT INTO achievements (player_id, title, award_type, tournament_name, issued_date, pdf_path, achievement_code) 
      VALUES (?, ?, ?, ?, COALESCE(?, date('now')), ?, ?)
    `, [player_id, title, award_type, tournament_name, issued_date, pdf_path, achievement_code]);
    
    const id = db.getLastInsertRowId();
    const newAchievement = db.get('SELECT * FROM achievements WHERE id = ?', [id]);
    
    if (req.admin && req.admin.admin_id) {
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [req.admin.admin_id, 'CREATE_ACHIEVEMENT', `Created achievement for player ${player_id}`, req.ip]
      );
    }

    broadcastEvent('entity_update', { type: 'achievements' });
    res.status(201).json(newAchievement);
  } catch (err) {
    console.error('Create achievement error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT update achievement (Admin only)
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { player_id, title, award_type, tournament_name, issued_date, pdf_path } = req.body;
    
    const existing = db.get('SELECT * FROM achievements WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ error: 'Achievement not found.' });
    }

    db.run(`
      UPDATE achievements SET 
        player_id = ?, title = ?, award_type = ?, tournament_name = ?, issued_date = ?, pdf_path = ?
      WHERE id = ?
    `, [
      player_id !== undefined ? player_id : existing.player_id, 
      title || existing.title, 
      award_type || existing.award_type, 
      tournament_name !== undefined ? tournament_name : existing.tournament_name, 
      issued_date || existing.issued_date, 
      pdf_path !== undefined ? pdf_path : existing.pdf_path,
      Number(id)
    ]);
    
    const updated = db.get('SELECT * FROM achievements WHERE id = ?', [Number(id)]);
    
    if (req.admin && req.admin.admin_id) {
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [req.admin.admin_id, 'UPDATE_ACHIEVEMENT', `Updated achievement ${id}`, req.ip]
      );
    }

    broadcastEvent('entity_update', { type: 'achievements' });
    res.json(updated);
  } catch (err) {
    console.error('Update achievement error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE achievement (Admin only)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const existing = db.get('SELECT * FROM achievements WHERE id = ?', [Number(req.params.id)]);
    if (!existing) {
      return res.status(404).json({ error: 'Achievement not found.' });
    }

    db.run('DELETE FROM achievements WHERE id = ?', [Number(req.params.id)]);
    
    if (req.admin && req.admin.admin_id) {
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [req.admin.admin_id, 'DELETE_ACHIEVEMENT', `Deleted achievement ${req.params.id}`, req.ip]
      );
    }

    broadcastEvent('entity_update', { type: 'achievements' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete achievement error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

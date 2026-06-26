import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { getDb } from '../db/schema.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' },
});

router.post('/login', loginLimiter, (req, res) => {
  try {
    const { player_login_id, password } = req.body;

    if (!player_login_id || !password) {
      return res.status(400).json({ error: 'Player ID and password are required.' });
    }

    const db = getDb();
    const player = db.get('SELECT * FROM players WHERE player_login_id = ?', [player_login_id]);

    if (!player) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (player.approval_status === 'pending') {
      return res.status(403).json({ error: 'Your account is pending approval.' });
    }

    if (player.approval_status === 'rejected') {
      return res.status(403).json({ error: 'Your registration request was rejected.' });
    }

    if (player.status === 'suspended' || player.status === 'banned') {
      return res.status(403).json({ error: `Your account is ${player.status}.` });
    }

    const isValid = bcrypt.compareSync(password, player.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken({ id: player.id, type: 'player', player_login_id: player.player_login_id });

    res.json({
      message: 'Login successful',
      token,
      player: { 
        id: player.id, 
        name: player.name,
        player_login_id: player.player_login_id,
        team_id: player.team_id,
        department_id: player.department_id 
      },
    });
  } catch (err) {
    console.error('Player login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/register', (req, res) => {
  try {
    const { name, department_id, roll_number, player_login_id, password } = req.body;

    if (!name || !department_id || !player_login_id || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const db = getDb();
    const existing = db.get('SELECT id FROM players WHERE player_login_id = ?', [player_login_id]);
    if (existing) {
      return res.status(409).json({ error: 'Player ID already taken.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.run(
      `INSERT INTO players (name, department_id, roll_number, player_login_id, password_hash, approval_status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [name, department_id, roll_number || null, player_login_id, hash]
    );

    const newId = db.getLastInsertRowId();
    const newPlayer = db.get('SELECT id, name, player_login_id, approval_status FROM players WHERE id = ?', [newId]);

    try {
      import('./sse.js').then(sse => {
        sse.broadcastEvent('player_registered', newPlayer);
      });
    } catch(e) {}

    res.status(201).json({
      message: 'Registration successful! Your account is pending approval.',
      player: newPlayer
    });

  } catch (err) {
    console.error('Player registration error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/me', authenticate, (req, res) => {
  try {
    if (!req.player) {
      return res.status(403).json({ error: 'Not authenticated as player' });
    }

    const db = getDb();
    const player = db.get(`
      SELECT p.*, d.name as department_name, d.code as department_code, t.name as team_name, t.logo_url as team_logo
      FROM players p
      JOIN departments d ON p.department_id = d.id
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.id = ?
    `, [req.player.id]);

    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }
    
    delete player.password_hash;
    res.json({ player });
  } catch (err) {
    console.error('Get player me error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

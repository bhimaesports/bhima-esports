import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import upload from '../middleware/upload.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/registrations - list registrations
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { tournament_id, status, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT r.*, t.name as team_name, t.team_id as team_code,
             d.name as department_name, d.code as department_code,
             tn.name as tournament_name
      FROM registrations r
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN tournaments tn ON r.tournament_id = tn.id
      WHERE 1=1
    `;
    const params = [];

    if (tournament_id) {
      sql += ' AND r.tournament_id = ?';
      params.push(Number(tournament_id));
    }
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (t.name LIKE ? OR r.registration_number LIKE ? OR t.team_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const countSql = sql.replace(/SELECT r\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const total = db.get(countSql, params)?.total || 0;

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const registrations = db.all(sql, params);

    res.json({
      registrations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get registrations error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/registrations - public registration (creates team + players + registration)
router.post('/', upload.single('logo'), (req, res) => {
  try {
    const db = getDb();
    const {
      tournament_id,
      team_name,
      department_id,
      year,
      captain_name,
      captain_roll,
      captain_phone,
      leader_uid,
      leader_ign,
      motto,
      players,
    } = req.body;

    const parsedPlayers = typeof players === 'string' ? JSON.parse(players) : players;

    // Validate required fields
    if (!tournament_id || !team_name || !department_id) {
      return res.status(400).json({
        error: 'tournament_id, team_name, and department_id are required.',
      });
    }

    if (!parsedPlayers || !Array.isArray(parsedPlayers) || parsedPlayers.length === 0) {
      return res.status(400).json({ error: 'At least one player is required.' });
    }

    // Check if registration is enabled
    const regSetting = db.get("SELECT value FROM settings WHERE key = 'registration_enabled'");
    if (regSetting && regSetting.value === 'false') {
      return res.status(403).json({ error: 'Registration is currently disabled.' });
    }

    // Verify tournament exists and is open
    const tournament = db.get('SELECT * FROM tournaments WHERE id = ?', [Number(tournament_id)]);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }
    if (tournament.status !== 'open') {
      return res.status(400).json({ error: 'Tournament is not open for registration.' });
    }

    // Check slots
    if (tournament.registered_count >= tournament.team_slots) {
      return res.status(400).json({ error: 'Tournament is full. No slots available.' });
    }

    // Verify department
    const dept = db.get('SELECT * FROM departments WHERE id = ?', [Number(department_id)]);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    // Use a transaction to create team + players + registration atomically
    const result = db.transaction(() => {
      // Generate team_id
      const teamCount = db.get(
        'SELECT COUNT(*) as count FROM teams WHERE department_id = ?',
        [Number(department_id)]
      );
      const seq = String((teamCount?.count || 0) + 1).padStart(4, '0');
      const team_id_code = `BE-${dept.code}-${seq}`;

      // Create team with logo
      const logo_url = req.file ? `/uploads/${req.file.filename}` : null;
      db.run(
        `INSERT INTO teams (team_id, name, department_id, year, captain_name, captain_roll,
                            captain_phone, leader_uid, leader_ign, logo_url, motto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          team_id_code, team_name, Number(department_id),
          year ? Number(year) : null,
          captain_name || null, captain_roll || null, captain_phone || null,
          leader_uid || null, leader_ign || null, logo_url, motto || null,
        ]
      );
      const teamDbId = db.getLastInsertRowId();

      // Add to team_leaderboard
      db.run('INSERT OR IGNORE INTO team_leaderboard (team_id) VALUES (?)', [teamDbId]);

      // Create players
      for (const p of parsedPlayers) {
        db.run(
          `INSERT INTO players (name, department_id, team_id, uid, year, roll_number)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            p.name,
            Number(department_id),
            teamDbId,
            p.uid || null,
            p.year ? Number(p.year) : (year ? Number(year) : null),
            p.roll_number || null,
          ]
        );
      }

      // Generate unique registration number
      const regNum = `REG-${uuidv4().split('-')[0].toUpperCase()}`;

      // Create registration
      db.run(
        `INSERT INTO registrations (registration_number, team_id, tournament_id)
         VALUES (?, ?, ?)`,
        [regNum, teamDbId, Number(tournament_id)]
      );
      const regId = db.getLastInsertRowId();

      // Update tournament registered_count
      db.run(
        'UPDATE tournaments SET registered_count = registered_count + 1 WHERE id = ?',
        [Number(tournament_id)]
      );

      return {
        registration_id: regId,
        registration_number: regNum,
        team_id: team_id_code,
        team_db_id: teamDbId,
      };
    });

    broadcastEvent('entity_update', { entity: 'registrations' });

    res.status(201).json({
      message: 'Registration successful!',
      registration_number: result.registration_number,
      team_id: result.team_id,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/registrations/:id/status - approve/reject registration
router.patch('/:id/status', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved/rejected) is required.' });
    }

    const registration = db.get('SELECT * FROM registrations WHERE id = ?', [Number(id)]);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ error: `Registration already ${registration.status}.` });
    }

    db.run('UPDATE registrations SET status = ? WHERE id = ?', [status, Number(id)]);

    // If rejected, decrement registered_count
    if (status === 'rejected') {
      db.run(
        'UPDATE tournaments SET registered_count = MAX(0, registered_count - 1) WHERE id = ?',
        [registration.tournament_id]
      );
    }

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.admin.admin_id,
        'REGISTRATION_STATUS',
        `Registration ${registration.registration_number} ${status}`,
        req.ip,
      ]
    );

    const updated = db.get(
      `SELECT r.*, t.name as team_name, t.team_id as team_code, tn.name as tournament_name
       FROM registrations r
       LEFT JOIN teams t ON r.team_id = t.id
       LEFT JOIN tournaments tn ON r.tournament_id = tn.id
       WHERE r.id = ?`,
      [Number(id)]
    );

    broadcastEvent('entity_update', { entity: 'registrations' });

    res.json({ message: `Registration ${status}.`, registration: updated });
  } catch (err) {
    console.error('Registration status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

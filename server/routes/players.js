import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/players - list players with filters
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { team_id, department_id, status, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT p.*, d.name as department_name, d.code as department_code,
             t.name as team_name, t.team_id as team_code
      FROM players p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (team_id) {
      sql += ' AND p.team_id = ?';
      params.push(Number(team_id));
    }
    if (department_id) {
      sql += ' AND p.department_id = ?';
      params.push(Number(department_id));
    }
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.roll_number LIKE ? OR p.uid LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const countSql = sql.replace(/SELECT p\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const total = db.get(countSql, params)?.total || 0;

    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const players = db.all(sql, params);

    res.json({
      players,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get players error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/players - create player (admin)
router.post('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { name, department_id, team_id, uid, year, roll_number } = req.body;

    if (!name || !department_id) {
      return res.status(400).json({ error: 'Name and department_id are required.' });
    }

    // Verify department
    const dept = db.get('SELECT id FROM departments WHERE id = ?', [Number(department_id)]);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    // Verify team if provided
    if (team_id) {
      const team = db.get('SELECT id FROM teams WHERE id = ?', [Number(team_id)]);
      if (!team) {
        return res.status(404).json({ error: 'Team not found.' });
      }
    }

    db.run(
      `INSERT INTO players (name, department_id, team_id, uid, year, roll_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, Number(department_id), team_id ? Number(team_id) : null,
       uid || null, year ? Number(year) : null, roll_number || null]
    );

    const id = db.getLastInsertRowId();
    const player = db.get('SELECT * FROM players WHERE id = ?', [id]);

    broadcastEvent('entity_update', { entity: 'players' });

    res.status(201).json({ message: 'Player created successfully.', player });
  } catch (err) {
    console.error('Create player error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/players/:id - update player (admin)
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const player = db.get('SELECT * FROM players WHERE id = ?', [Number(id)]);
    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    const { name, department_id, team_id, uid, year, roll_number, kills, wins, matches_played, mvp_awards } = req.body;

    db.run(
      `UPDATE players SET
         name = ?, department_id = ?, team_id = ?, uid = ?, year = ?,
         roll_number = ?, kills = ?, wins = ?, matches_played = ?, mvp_awards = ?
       WHERE id = ?`,
      [
        name || player.name,
        department_id ? Number(department_id) : player.department_id,
        team_id !== undefined ? (team_id ? Number(team_id) : null) : player.team_id,
        uid ?? player.uid,
        year ? Number(year) : player.year,
        roll_number ?? player.roll_number,
        kills !== undefined ? Number(kills) : player.kills,
        wins !== undefined ? Number(wins) : player.wins,
        matches_played !== undefined ? Number(matches_played) : player.matches_played,
        mvp_awards !== undefined ? Number(mvp_awards) : player.mvp_awards,
        Number(id),
      ]
    );

    const updated = db.get('SELECT * FROM players WHERE id = ?', [Number(id)]);
    
    broadcastEvent('entity_update', { entity: 'players' });
    
    res.json({ message: 'Player updated successfully.', player: updated });
  } catch (err) {
    console.error('Update player error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/players/:id - delete player (admin)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const player = db.get('SELECT * FROM players WHERE id = ?', [Number(id)]);
    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    db.run('DELETE FROM players WHERE id = ?', [Number(id)]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'DELETE_PLAYER', `Deleted player: ${player.name}`, req.ip]
    );

    broadcastEvent('entity_update', { entity: 'players' });

    res.json({ message: 'Player deleted successfully.' });
  } catch (err) {
    console.error('Delete player error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/players/:id/status - change player status
router.patch('/:id/status', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (active/suspended/banned) is required.' });
    }

    const player = db.get('SELECT * FROM players WHERE id = ?', [Number(id)]);
    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    db.run('UPDATE players SET status = ? WHERE id = ?', [status, Number(id)]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'PLAYER_STATUS_CHANGE', `Player ${player.name} status -> ${status}`, req.ip]
    );

    const updated = db.get('SELECT * FROM players WHERE id = ?', [Number(id)]);
    
    broadcastEvent('entity_update', { entity: 'players' });
    
    res.json({ message: `Player ${status} successfully.`, player: updated });
  } catch (err) {
    console.error('Player status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/players/:id/transfer - transfer player to another team
router.patch('/:id/transfer', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { team_id } = req.body;

    const player = db.get('SELECT * FROM players WHERE id = ?', [Number(id)]);
    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    if (team_id) {
      const team = db.get('SELECT * FROM teams WHERE id = ?', [Number(team_id)]);
      if (!team) {
        return res.status(404).json({ error: 'Target team not found.' });
      }

      db.run('UPDATE players SET team_id = ?, department_id = ? WHERE id = ?', [
        Number(team_id),
        team.department_id,
        Number(id),
      ]);
    } else {
      // Remove from team
      db.run('UPDATE players SET team_id = NULL WHERE id = ?', [Number(id)]);
    }

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.admin.admin_id,
        'PLAYER_TRANSFER',
        `Player ${player.name} transferred to team_id: ${team_id || 'none'}`,
        req.ip,
      ]
    );

    const updated = db.get(
      `SELECT p.*, t.name as team_name, t.team_id as team_code
       FROM players p LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.id = ?`,
      [Number(id)]
    );

    broadcastEvent('entity_update', { entity: 'players' });

    res.json({ message: 'Player transferred successfully.', player: updated });
  } catch (err) {
    console.error('Player transfer error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/players/:id/analytics - get detailed analytics for a player
router.get('/:id/analytics', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const player = db.get(
      `SELECT p.*, d.name as department_name, t.name as team_name, t.team_id as team_code
       FROM players p
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.id = ?`,
      [Number(id)]
    );

    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    // Fetch match results for graph (Kills Per Match, Points Progression)
    const matchHistory = db.all(
      `SELECT pr.kills, pr.damage, pr.headshots, pr.survival_time, pr.points, m.match_number, m.date, tn.name as tournament_name
       FROM player_results pr
       JOIN matches m ON pr.match_id = m.id
       JOIN tournaments tn ON m.tournament_id = tn.id
       WHERE pr.player_id = ?
       ORDER BY m.date ASC, m.match_number ASC`,
      [Number(id)]
    );

    let cumulativePoints = 0;
    const killsProgression = matchHistory.map((m, index) => {
      cumulativePoints += m.points;
      return {
        name: `M${index + 1}`,
        kills: m.kills,
        damage: m.damage,
        points: m.points,
        cumulative: cumulativePoints,
        tournament: m.tournament_name
      };
    });

    res.json({
      player,
      matchHistory: killsProgression
    });
  } catch (err) {
    console.error('Player analytics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

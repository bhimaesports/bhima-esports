import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/teams - list teams with optional filters
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { department_id, status, search, year, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT t.*, d.name as department_name, d.code as department_code,
             (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) as player_count
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      sql += ' AND t.department_id = ?';
      params.push(Number(department_id));
    }
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (year) {
      sql += ' AND t.year = ?';
      params.push(Number(year));
    }
    if (search) {
      sql += ' AND (t.name LIKE ? OR t.team_id LIKE ? OR t.captain_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // Count total
    const countSql = sql.replace(/SELECT t\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const total = db.get(countSql, params)?.total || 0;

    sql += ' ORDER BY t.created_at DESC';
    const offset = (Number(page) - 1) * Number(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const teams = db.all(sql, params);

    res.json({
      teams,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/teams - create team (admin)
router.post('/', authenticate, upload.single('logo'), (req, res) => {
  try {
    const db = getDb();
    const {
      name, department_id, year, captain_name, captain_roll,
      captain_phone, leader_uid, leader_ign, motto,
    } = req.body;

    if (!name || !department_id) {
      return res.status(400).json({ error: 'Name and department_id are required.' });
    }

    // Verify department exists
    const dept = db.get('SELECT * FROM departments WHERE id = ?', [Number(department_id)]);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    // Generate team_id
    const teamCount = db.get(
      'SELECT COUNT(*) as count FROM teams WHERE department_id = ?',
      [Number(department_id)]
    );
    const seq = String((teamCount?.count || 0) + 1).padStart(4, '0');
    const team_id = `BE-${dept.code}-${seq}`;

    const logo_url = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
      `INSERT INTO teams (team_id, name, department_id, year, captain_name, captain_roll,
                          captain_phone, leader_uid, leader_ign, logo_url, motto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [team_id, name, Number(department_id), year ? Number(year) : null,
       captain_name || null, captain_roll || null, captain_phone || null,
       leader_uid || null, leader_ign || null, logo_url, motto || null]
    );

    const id = db.getLastInsertRowId();
    const team = db.get('SELECT * FROM teams WHERE id = ?', [id]);

    broadcastEvent('entity_update', { entity: 'teams' });

    res.status(201).json({ message: 'Team created successfully.', team });
  } catch (err) {
    console.error('Create team error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/teams/:id - update team (admin)
router.put('/:id', authenticate, upload.single('logo'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const team = db.get('SELECT * FROM teams WHERE id = ?', [Number(id)]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const {
      name, department_id, year, captain_name, captain_roll,
      captain_phone, leader_uid, leader_ign, motto,
    } = req.body;

    const logo_url = req.file ? `/uploads/${req.file.filename}` : team.logo_url;

    db.run(
      `UPDATE teams SET
         name = ?, department_id = ?, year = ?, captain_name = ?, captain_roll = ?,
         captain_phone = ?, leader_uid = ?, leader_ign = ?, logo_url = ?, motto = ?
       WHERE id = ?`,
      [
        name || team.name,
        department_id ? Number(department_id) : team.department_id,
        year ? Number(year) : team.year,
        captain_name ?? team.captain_name,
        captain_roll ?? team.captain_roll,
        captain_phone ?? team.captain_phone,
        leader_uid ?? team.leader_uid,
        leader_ign ?? team.leader_ign,
        logo_url,
        motto ?? team.motto,
        Number(id),
      ]
    );

    const updated = db.get('SELECT * FROM teams WHERE id = ?', [Number(id)]);
    
    broadcastEvent('entity_update', { entity: 'teams' });
    
    res.json({ message: 'Team updated successfully.', team: updated });
  } catch (err) {
    console.error('Update team error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/teams/:id - delete team (admin)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const team = db.get('SELECT * FROM teams WHERE id = ?', [Number(id)]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Delete associated players
    db.run('DELETE FROM players WHERE team_id = ?', [Number(id)]);
    // Delete associated registrations
    db.run('DELETE FROM registrations WHERE team_id = ?', [Number(id)]);
    // Delete from leaderboard
    db.run('DELETE FROM team_leaderboard WHERE team_id = ?', [Number(id)]);
    // Delete results
    db.run('DELETE FROM results WHERE team_id = ?', [Number(id)]);
    // Delete the team
    db.run('DELETE FROM teams WHERE id = ?', [Number(id)]);

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'DELETE_TEAM', `Deleted team: ${team.name} (${team.team_id})`, req.ip]
    );

    broadcastEvent('entity_update', { entity: 'teams' });

    res.json({ message: 'Team deleted successfully.' });
  } catch (err) {
    console.error('Delete team error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/teams/:id/status - ban/suspend/restore team
router.patch('/:id/status', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status, ban_reason } = req.body;

    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (active/suspended/banned) is required.' });
    }

    const team = db.get('SELECT * FROM teams WHERE id = ?', [Number(id)]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    if (status === 'banned' || status === 'suspended') {
      db.run(
        `UPDATE teams SET status = ?, ban_reason = ?, ban_date = datetime('now'), banned_by = ?
         WHERE id = ?`,
        [status, ban_reason || null, req.admin.admin_id, Number(id)]
      );
    } else {
      db.run(
        'UPDATE teams SET status = ?, ban_reason = NULL, ban_date = NULL, banned_by = NULL WHERE id = ?',
        [status, Number(id)]
      );
    }

    // Also update all players in this team
    if (status === 'banned' || status === 'suspended') {
      db.run('UPDATE players SET status = ? WHERE team_id = ?', [status, Number(id)]);
    } else {
      db.run("UPDATE players SET status = 'active' WHERE team_id = ?", [Number(id)]);
    }

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.admin.admin_id,
        'TEAM_STATUS_CHANGE',
        `Team ${team.team_id} status changed to ${status}. Reason: ${ban_reason || 'N/A'}`,
        req.ip,
      ]
    );

    const updated = db.get('SELECT * FROM teams WHERE id = ?', [Number(id)]);
    
    broadcastEvent('entity_update', { entity: 'teams' });
    
    res.json({ message: `Team ${status} successfully.`, team: updated });
  } catch (err) {
    console.error('Team status change error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/teams/:id/analytics - get detailed analytics for a team
router.get('/:id/analytics', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    // Fetch base team info
    const team = db.get(
      `SELECT t.*, d.name as department_name, tl.total_points, tl.matches, tl.wins, tl.total_kills, tl.current_rank
       FROM teams t
       LEFT JOIN departments d ON t.department_id = d.id
       LEFT JOIN team_leaderboard tl ON t.id = tl.team_id
       WHERE t.id = ?`,
      [Number(id)]
    );

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Fetch players
    const players = db.all('SELECT * FROM players WHERE team_id = ? ORDER BY kills DESC', [Number(id)]);

    // Fetch match results for graph (Match Results Timeline, Points Growth)
    const matchHistory = db.all(
      `SELECT r.rank, r.kills, r.total_points, r.placement_points, r.kill_points, m.match_number, m.date, tn.name as tournament_name
       FROM results r
       JOIN matches m ON r.match_id = m.id
       JOIN tournaments tn ON m.tournament_id = tn.id
       WHERE r.team_id = ?
       ORDER BY m.date ASC, m.match_number ASC`,
      [Number(id)]
    );

    // Calculate progression data for graphs
    let cumulativePoints = 0;
    const pointsProgression = matchHistory.map((m, index) => {
      cumulativePoints += m.total_points;
      return {
        name: `M${index + 1}`,
        points: m.total_points,
        cumulative: cumulativePoints,
        kills: m.kills,
        rank: m.rank,
        tournament: m.tournament_name
      };
    });

    const killDistribution = players.map(p => ({
      name: p.name,
      kills: p.kills,
      damage: p.total_damage || 0
    }));

    res.json({
      team,
      players,
      matchHistory: pointsProgression,
      killDistribution
    });
  } catch (err) {
    console.error('Team analytics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

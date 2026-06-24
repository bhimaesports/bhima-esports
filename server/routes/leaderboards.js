import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { recalculateTeamRanks, updateDeptLeaderboard } from '../utils/pointCalculator.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/leaderboards/teams - team leaderboard
router.get('/teams', (req, res) => {
  try {
    const db = getDb();
    const { limit = 50, department_id } = req.query;

    let sql = `
      SELECT tl.*, t.name as team_name, t.team_id as team_code, t.logo_url as team_logo,
             d.name as department_name, d.code as department_code
      FROM team_leaderboard tl
      LEFT JOIN teams t ON tl.team_id = t.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.status = 'active'
    `;
    const params = [];

    if (department_id) {
      sql += ' AND t.department_id = ?';
      params.push(Number(department_id));
    }

    sql += ' ORDER BY tl.current_rank ASC LIMIT ?';
    params.push(Number(limit));

    const leaderboard = db.all(sql, params);

    // Add rank change info
    for (const entry of leaderboard) {
      if (entry.prev_rank > 0 && entry.current_rank > 0) {
        entry.rank_change = entry.prev_rank - entry.current_rank; // positive = moved up
      } else {
        entry.rank_change = 0;
      }
      entry.points_change = entry.total_points - (entry.prev_points || 0);
    }

    res.json({ leaderboard });
  } catch (err) {
    console.error('Team leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leaderboards/departments - department leaderboard
router.get('/departments', (req, res) => {
  try {
    const db = getDb();

    const leaderboard = db.all(
      `SELECT dl.*, d.name as department_name, d.code as department_code
       FROM dept_leaderboard dl
       LEFT JOIN departments d ON dl.department_id = d.id
       ORDER BY dl.current_rank ASC`
    );

    for (const entry of leaderboard) {
      if (entry.prev_rank > 0 && entry.current_rank > 0) {
        entry.rank_change = entry.prev_rank - entry.current_rank;
      } else {
        entry.rank_change = 0;
      }
      entry.points_change = entry.total_points - (entry.prev_points || 0);
    }

    res.json({ leaderboard });
  } catch (err) {
    console.error('Dept leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leaderboards/championship - monthly championship standings
router.get('/championship', (req, res) => {
  try {
    const db = getDb();
    const { month, year } = req.query;

    // Get championship standings by aggregating match results
    // Filter by month/year if provided
    let dateFilter = '';
    const params = [];

    if (month && year) {
      dateFilter = "AND m.date LIKE ?";
      params.push(`${year}-${String(month).padStart(2, '0')}%`);
    } else if (year) {
      dateFilter = "AND m.date LIKE ?";
      params.push(`${year}%`);
    }

    const standings = db.all(
      `SELECT
         t.id as team_id,
         t.name as team_name,
         t.team_id as team_code,
         t.logo_url as team_logo,
         d.code as department_code,
         COUNT(DISTINCT r.match_id) as matches_played,
         SUM(r.kills) as total_kills,
         SUM(r.total_points) as total_points,
         SUM(CASE WHEN r.rank = 1 THEN 1 ELSE 0 END) as wins
       FROM results r
       JOIN matches m ON r.match_id = m.id
       JOIN teams t ON r.team_id = t.id
       LEFT JOIN departments d ON t.department_id = d.id
       WHERE m.status = 'completed' ${dateFilter}
       GROUP BY t.id
       ORDER BY total_points DESC`,
      params
    );

    // Assign championship ranks
    standings.forEach((s, i) => {
      s.championship_rank = i + 1;
    });

    res.json({ standings });
  } catch (err) {
    console.error('Championship error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leaderboards/clash-squad - clash squad standings
router.get('/clash-squad', (req, res) => {
  try {
    const db = getDb();

    const sql = `
      SELECT 
        t.id as team_id,
        t.name as team_name,
        t.team_id as team_code,
        t.logo_url as team_logo,
        d.code as department_code,
        COUNT(DISTINCT r.match_id) as matches_played,
        SUM(CASE WHEN r.rank = 1 THEN 1 ELSE 0 END) as wins,
        SUM(r.kills) as total_kills,
        SUM(CASE WHEN r.rank = 1 THEN 3 ELSE 1 END) as total_points
      FROM results r
      JOIN matches m ON r.match_id = m.id
      JOIN tournaments tn ON m.tournament_id = tn.id
      JOIN teams t ON r.team_id = t.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE tn.mode = 'cs' AND m.status = 'completed'
      GROUP BY t.id
      ORDER BY wins DESC, total_kills DESC
    `;
    const standings = db.all(sql);

    // Assign CS ranks
    standings.forEach((s, i) => {
      s.current_rank = i + 1;
    });

    res.json({ standings });
  } catch (err) {
    console.error('Clash Squad leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/leaderboards/teams/:id - manual override team leaderboard entry (admin)
router.put('/teams/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { matches, wins, total_kills, total_points } = req.body;

    const entry = db.get('SELECT * FROM team_leaderboard WHERE id = ?', [Number(id)]);
    if (!entry) {
      return res.status(404).json({ error: 'Leaderboard entry not found.' });
    }

    db.run(
      `UPDATE team_leaderboard SET
         prev_points = total_points,
         prev_rank = current_rank,
         matches = ?, wins = ?, total_kills = ?, total_points = ?
       WHERE id = ?`,
      [
        matches !== undefined ? Number(matches) : entry.matches,
        wins !== undefined ? Number(wins) : entry.wins,
        total_kills !== undefined ? Number(total_kills) : entry.total_kills,
        total_points !== undefined ? Number(total_points) : entry.total_points,
        Number(id),
      ]
    );

    // Recalculate ranks and update department leaderboard
    db.transaction(() => {
      recalculateTeamRanks();
      updateDeptLeaderboard();
    });

    // Query updated leaderboard for live SSE broadcast
    const teamLeaderboard = db.all(
      `SELECT tl.*, t.name as team_name, t.team_id as team_code, d.code as department_code
       FROM team_leaderboard tl
       LEFT JOIN teams t ON tl.team_id = t.id
       LEFT JOIN departments d ON t.department_id = d.id
       ORDER BY tl.current_rank ASC`
    );
    broadcastEvent('leaderboard_updated', { teamLeaderboard });

    res.json({ message: 'Leaderboard entry updated successfully.' });
  } catch (err) {
    console.error('Update team leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/leaderboards/departments/:id - manual override dept leaderboard entry (admin)
router.put('/departments/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { wins, teams_participated, total_points } = req.body;

    const entry = db.get('SELECT * FROM dept_leaderboard WHERE id = ?', [Number(id)]);
    if (!entry) {
      return res.status(404).json({ error: 'Leaderboard entry not found.' });
    }

    db.run(
      `UPDATE dept_leaderboard SET
         prev_points = total_points,
         prev_rank = current_rank,
         wins = ?, teams_participated = ?, total_points = ?
       WHERE id = ?`,
      [
        wins !== undefined ? Number(wins) : entry.wins,
        teams_participated !== undefined ? Number(teams_participated) : entry.teams_participated,
        total_points !== undefined ? Number(total_points) : entry.total_points,
        Number(id),
      ]
    );

    // Recalculate department ranks
    db.transaction(() => {
      const depts = db.all('SELECT id FROM dept_leaderboard ORDER BY total_points DESC');
      for (let i = 0; i < depts.length; i++) {
        db.run('UPDATE dept_leaderboard SET current_rank = ? WHERE id = ?', [i + 1, depts[i].id]);
      }
    });

    // Query updated leaderboard to broadcast
    const teamLeaderboard = db.all(
      `SELECT tl.*, t.name as team_name, t.team_id as team_code, d.code as department_code
       FROM team_leaderboard tl
       LEFT JOIN teams t ON tl.team_id = t.id
       LEFT JOIN departments d ON t.department_id = d.id
       ORDER BY tl.current_rank ASC`
    );
    broadcastEvent('leaderboard_updated', { teamLeaderboard });

    res.json({ message: 'Leaderboard entry updated successfully.' });
  } catch (err) {
    console.error('Update dept leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leaderboards/history - list completed seasons
router.get('/history', (req, res) => {
  try {
    const db = getDb();
    const seasons = db.all('SELECT DISTINCT season FROM leaderboard_history ORDER BY archived_at DESC');
    res.json({ seasons: seasons.map(s => s.season) });
  } catch (err) {
    console.error('Get history seasons error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leaderboards/history/:season - get archived standings for a specific season
router.get('/history/:season', (req, res) => {
  try {
    const db = getDb();
    const { season } = req.params;

    const standings = db.all(
      'SELECT * FROM leaderboard_history WHERE season = ? ORDER BY final_rank ASC',
      [season]
    );

    const championship = db.get(
      'SELECT * FROM championship_history WHERE season = ?',
      [season]
    );

    if (standings.length === 0) {
      return res.status(404).json({ error: 'Season not found in archives.' });
    }

    res.json({ season, standings, championship });
  } catch (err) {
    console.error('Get season standings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/leaderboards/archive - archive current standings into history (admin only)
router.post('/archive', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { season } = req.body;

    if (!season || !season.trim()) {
      return res.status(400).json({ error: 'season name is required.' });
    }

    // Check if season exists
    const exists = db.get('SELECT COUNT(*) as count FROM championship_history WHERE season = ?', [season.trim()]);
    if (exists.count > 0) {
      return res.status(400).json({ error: 'This season has already been archived.' });
    }

    // Calculate metadata for championship_history
    const champion = db.get(`
      SELECT t.name as team_name, d.code as dept_code, tl.total_points
      FROM team_leaderboard tl
      JOIN teams t ON tl.team_id = t.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE tl.current_rank = 1
    `);

    const runnerUp = db.get(`
      SELECT t.name as team_name
      FROM team_leaderboard tl
      JOIN teams t ON tl.team_id = t.id
      WHERE tl.current_rank = 2
    `);

    const mvp = db.get(`
      SELECT name, kills FROM players ORDER BY kills DESC LIMIT 1
    `);

    const stats = db.get(`
      SELECT COUNT(*) as total_teams, SUM(matches) as total_matches FROM team_leaderboard
    `);

    db.transaction(() => {
      // 1. Archive team leaderboard
      db.run(`
        INSERT INTO leaderboard_history (season, team_id, team_name, team_code, department_code, matches_played, wins, total_kills, total_points, final_rank)
        SELECT ?, t.id, t.name, t.team_id, d.code, tl.matches, tl.wins, tl.total_kills, tl.total_points, tl.current_rank
        FROM team_leaderboard tl
        JOIN teams t ON tl.team_id = t.id
        LEFT JOIN departments d ON t.department_id = d.id
      `, [season.trim()]);

      // 2. Archive championship history summary
      db.run(`
        INSERT INTO championship_history (season, champion_team_name, champion_dept_code, runner_up_name, mvp_player_name, mvp_player_kills, total_teams, total_matches)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        season.trim(),
        champion ? champion.team_name : 'No Champion',
        champion ? champion.dept_code : 'N/A',
        runnerUp ? runnerUp.team_name : 'No Runner-Up',
        mvp ? mvp.name : 'No MVP',
        mvp ? mvp.kills : 0,
        stats ? stats.total_teams : 0,
        stats ? stats.total_matches : 0
      ]);

      // 3. Reset team leaderboard
      db.run(`
        UPDATE team_leaderboard SET
          matches = 0, wins = 0, total_kills = 0, total_points = 0,
          prev_points = 0, prev_rank = 0, current_rank = 0
      `);

      // 4. Reset department leaderboard
      db.run(`
        UPDATE dept_leaderboard SET
          wins = 0, total_points = 0,
          prev_points = 0, prev_rank = 0, current_rank = 0
      `);

      // 5. Reset players stats
      db.run(`
        UPDATE players SET
          kills = 0, wins = 0, matches_played = 0, mvp_awards = 0
      `);

      // 6. Delete all completed matches and results to clear live slate
      // (Optional, but ensures matches starts clean. Wait, we should keep the tournaments records, but we can delete match results or leave them. Let's delete results so they don't count towards active standings).
      // Actually, deleting results is not required if we reset the leaderboards directly, because matches are linked to tournaments which remain in the history. But resetting the tables is sufficient.
    });

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [req.admin.admin_id, 'ARCHIVE_SEASON', `Archived season: ${season.trim()}`, req.ip]
    );

    broadcastEvent('leaderboard_updated', {});

    res.json({ message: `Standings for ${season} have been successfully archived.` });
  } catch (err) {
    console.error('Archive leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

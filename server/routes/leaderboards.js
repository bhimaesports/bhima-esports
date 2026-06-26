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
    const { matches, wins, total_kills, total_points, is_qualified } = req.body;

    const entry = db.get('SELECT * FROM team_leaderboard WHERE id = ?', [Number(id)]);
    if (!entry) {
      return res.status(404).json({ error: 'Leaderboard entry not found.' });
    }

    db.run(
      `UPDATE team_leaderboard SET
         prev_points = total_points,
         prev_rank = current_rank,
         matches = ?, wins = ?, total_kills = ?, total_points = ?, is_qualified = ?
       WHERE id = ?`,
      [
        matches !== undefined ? Number(matches) : entry.matches,
        wins !== undefined ? Number(wins) : entry.wins,
        total_kills !== undefined ? Number(total_kills) : entry.total_kills,
        total_points !== undefined ? Number(total_points) : entry.total_points,
        is_qualified !== undefined ? (is_qualified ? 1 : 0) : entry.is_qualified,
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

// POST /api/leaderboards/teams - add team to leaderboard manually (admin)
router.post('/teams', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { team_id } = req.body;
    
    if (!team_id) return res.status(400).json({ error: 'team_id is required' });
    
    db.run('INSERT OR IGNORE INTO team_leaderboard (team_id) VALUES (?)', [Number(team_id)]);
    db.transaction(() => { recalculateTeamRanks(); });
    
    broadcastEvent('leaderboard_updated', {});
    res.json({ message: 'Team added to leaderboard successfully.' });
  } catch (err) {
    console.error('Add team leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/leaderboards/teams/:id - remove team from leaderboard manually (admin)
router.delete('/teams/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    db.run('DELETE FROM team_leaderboard WHERE id = ?', [Number(id)]);
    db.transaction(() => { recalculateTeamRanks(); });
    
    broadcastEvent('leaderboard_updated', {});
    res.json({ message: 'Team removed from leaderboard.' });
  } catch (err) {
    console.error('Delete team leaderboard error:', err);
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

// POST /api/leaderboards/departments - add dept to leaderboard manually (admin)
router.post('/departments', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { department_id } = req.body;
    
    if (!department_id) return res.status(400).json({ error: 'department_id is required' });
    
    db.run('INSERT OR IGNORE INTO dept_leaderboard (department_id) VALUES (?)', [Number(department_id)]);
    db.transaction(() => { updateDeptLeaderboard(); });
    
    broadcastEvent('leaderboard_updated', {});
    res.json({ message: 'Department added to leaderboard successfully.' });
  } catch (err) {
    console.error('Add dept leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/leaderboards/departments/:id - remove dept from leaderboard manually (admin)
router.delete('/departments/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    db.run('DELETE FROM dept_leaderboard WHERE id = ?', [Number(id)]);
    db.transaction(() => { updateDeptLeaderboard(); });
    
    broadcastEvent('leaderboard_updated', {});
    res.json({ message: 'Department removed from leaderboard.' });
  } catch (err) {
    console.error('Delete dept leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leaderboards/players - get player leaderboard entries
router.get('/players', (req, res) => {
  try {
    const db = getDb();
    const { tournament_id, department_id, season, search } = req.query;
    
    let sql = `
      SELECT pl.*, p.name, p.uid, p.role, t.name as team_name, d.code as department_code, tr.name as tournament_name
      FROM player_leaderboard pl
      JOIN players p ON pl.player_id = p.id
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id OR pl.department_id = d.id
      LEFT JOIN tournaments tr ON pl.tournament_id = tr.id
      WHERE 1=1
    `;
    const params = [];

    if (tournament_id) {
      sql += ' AND pl.tournament_id = ?';
      params.push(Number(tournament_id));
    }
    if (department_id) {
      sql += ' AND pl.department_id = ?';
      params.push(Number(department_id));
    }
    if (season) {
      sql += ' AND pl.season = ?';
      params.push(season);
    }
    if (search) {
      sql += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY pl.total_points DESC, pl.kills DESC';

    const leaderboard = db.all(sql, params);
    res.json({ leaderboard });
  } catch (err) {
    console.error('Player leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/leaderboards/players - Add Player to Leaderboard
router.post('/players', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { player_id, tournament_id, department_id, season } = req.body;
    
    if (!player_id) return res.status(400).json({ error: 'Player ID is required' });

    // Ensure no duplicate entry for the same tournament/season
    const existing = db.get(
      'SELECT id FROM player_leaderboard WHERE player_id = ? AND tournament_id IS ? AND season IS ?',
      [player_id, tournament_id || null, season || null]
    );

    if (existing) {
      return res.status(400).json({ error: 'Player is already on this leaderboard.' });
    }

    // Initialize with current player stats or 0
    const player = db.get('SELECT kills, wins, matches_played, total_points FROM players WHERE id = ?', [player_id]);

    db.run(
      `INSERT INTO player_leaderboard (player_id, tournament_id, department_id, season, matches, wins, total_kills, total_points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        player_id, 
        tournament_id || null, 
        department_id || null, 
        season || null,
        player?.matches_played || 0,
        player?.wins || 0,
        player?.kills || 0,
        player?.total_points || 0
      ]
    );

    broadcastEvent('entity_update', { type: 'leaderboards' });
    res.json({ message: 'Player added to leaderboard.' });
  } catch (err) {
    console.error('Add player leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/leaderboards/players/:id - Update player leaderboard entry
router.put('/players/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { matches, wins, total_kills, total_points, tournament_id, department_id, season } = req.body;

    const entry = db.get('SELECT * FROM player_leaderboard WHERE id = ?', [Number(id)]);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });

    db.run(`
      UPDATE player_leaderboard SET
        matches = ?, wins = ?, total_kills = ?, total_points = ?,
        tournament_id = ?, department_id = ?, season = ?
      WHERE id = ?
    `, [
      matches !== undefined ? Number(matches) : entry.matches,
      wins !== undefined ? Number(wins) : entry.wins,
      total_kills !== undefined ? Number(total_kills) : entry.total_kills,
      total_points !== undefined ? Number(total_points) : entry.total_points,
      tournament_id || entry.tournament_id,
      department_id || entry.department_id,
      season || entry.season,
      Number(id)
    ]);

    // Also trigger global recalculation in case this affects overall standings (optional, but good practice)
    const { recalculateAllPoints } = await import('../utils/pointCalculator.js');
    recalculateAllPoints();

    broadcastEvent('entity_update', { type: 'leaderboards' });
    res.json({ message: 'Player leaderboard updated.' });
  } catch (err) {
    console.error('Update player leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/leaderboards/players/:id - Remove player from leaderboard
router.delete('/players/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM player_leaderboard WHERE id = ?', [Number(req.params.id)]);
    broadcastEvent('entity_update', { type: 'leaderboards' });
    res.json({ message: 'Player removed from leaderboard.' });
  } catch(err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/leaderboards/players/reset - Reset player leaderboard
router.post('/players/reset', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM player_leaderboard');
    broadcastEvent('entity_update', { type: 'leaderboards' });
    res.json({ message: 'Player leaderboard has been reset.' });
  } catch(err) {
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

import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import {
  calculatePoints,
  updateTeamLeaderboard,
  recalculateTeamRanks,
  updateDeptLeaderboard,
} from '../utils/pointCalculator.js';
import { broadcastEvent } from './sse.js';

const router = Router();

// GET /api/matches - list matches with optional filters
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { tournament_id, status, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT m.*, tn.name as tournament_name
      FROM matches m
      LEFT JOIN tournaments tn ON m.tournament_id = tn.id
      WHERE 1=1
    `;
    const params = [];

    if (tournament_id) {
      sql += ' AND m.tournament_id = ?';
      params.push(Number(tournament_id));
    }
    if (status) {
      sql += ' AND m.status = ?';
      params.push(status);
    }

    const countSql = sql.replace(/SELECT m\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const total = db.get(countSql, params)?.total || 0;

    sql += ' ORDER BY m.match_number ASC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const matches = db.all(sql, params);

    // Attach results for each match
    for (const match of matches) {
      match.results = db.all(
        `SELECT r.*, t.name as team_name, t.team_id as team_code
         FROM results r
         LEFT JOIN teams t ON r.team_id = t.id
         WHERE r.match_id = ?
         ORDER BY r.rank ASC`,
        [match.id]
      );
    }

    res.json({
      matches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Get matches error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/matches - create match (admin)
router.post('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { tournament_id, match_number, date, status } = req.body;

    if (!tournament_id || !match_number) {
      return res.status(400).json({ error: 'tournament_id and match_number are required.' });
    }

    const tournament = db.get('SELECT id FROM tournaments WHERE id = ?', [Number(tournament_id)]);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    db.run(
      'INSERT INTO matches (tournament_id, match_number, date, status) VALUES (?, ?, ?, ?)',
      [Number(tournament_id), Number(match_number), date || null, status || 'upcoming']
    );

    const id = db.getLastInsertRowId();
    const match = db.get('SELECT * FROM matches WHERE id = ?', [id]);

    res.status(201).json({ message: 'Match created successfully.', match });
  } catch (err) {
    console.error('Create match error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/matches/:matchId/results - enter match results (admin)
router.post('/:matchId/results', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { matchId } = req.params;
    const { results } = req.body;

    // results = [{ team_id, rank, kills }, ...]
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        error: 'Results array is required. Each item: { team_id, rank, kills }',
      });
    }

    const match = db.get(
      `SELECT m.*, t.mode as tournament_mode 
       FROM matches m 
       JOIN tournaments t ON m.tournament_id = t.id 
       WHERE m.id = ?`,
      [Number(matchId)]
    );
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    // Clear old results for this match
    db.run('DELETE FROM results WHERE match_id = ?', [Number(matchId)]);

    const calculatedResults = [];

    db.transaction(() => {
      for (const entry of results) {
        const { team_id, rank, kills } = entry;

        // Verify team exists
        const team = db.get('SELECT * FROM teams WHERE id = ?', [Number(team_id)]);
        if (!team) continue;

        // Calculate points
        const points = calculatePoints(Number(rank), Number(kills || 0));

        // Insert result
        db.run(
          `INSERT INTO results (match_id, team_id, rank, kills, placement_points, kill_points, total_points)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            Number(matchId),
            Number(team_id),
            Number(rank),
            Number(kills || 0),
            points.placement_points,
            points.kill_points,
            points.total_points,
          ]
        );

        // Update team leaderboard only for Battle Royale (br)
        if (match.tournament_mode === 'br') {
          const isWin = Number(rank) === 1;
          updateTeamLeaderboard(Number(team_id), Number(kills || 0), points.total_points, isWin);
        }

        calculatedResults.push({
          team_id: Number(team_id),
          team_name: team.name,
          team_code: team.team_id,
          rank: Number(rank),
          kills: Number(kills || 0),
          ...points,
        });
      }

      // Recalculate ranks
      recalculateTeamRanks();
      updateDeptLeaderboard();

      // Mark match as completed
      db.run("UPDATE matches SET status = 'completed' WHERE id = ?", [Number(matchId)]);
    });

    // Get updated leaderboard
    const teamLeaderboard = db.all(
      `SELECT tl.*, t.name as team_name, t.team_id as team_code, d.code as department_code
       FROM team_leaderboard tl
       LEFT JOIN teams t ON tl.team_id = t.id
       LEFT JOIN departments d ON t.department_id = d.id
       ORDER BY tl.current_rank ASC`
    );

    // Broadcast real-time update
    broadcastEvent('results_updated', {
      match_id: Number(matchId),
      results: calculatedResults,
    });
    broadcastEvent('leaderboard_updated', { teamLeaderboard });

    db.run(
      'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        req.admin.admin_id,
        'ENTER_RESULTS',
        `Results entered for match #${match.match_number}`,
        req.ip,
      ]
    );

    res.json({
      message: 'Results entered and leaderboard updated.',
      results: calculatedResults,
      leaderboard: teamLeaderboard,
    });
  } catch (err) {
    console.error('Enter results error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

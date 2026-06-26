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
import upload from '../middleware/upload.js';

const router = Router();

// GET /api/matches - list matches with optional filters
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { tournament_id, status, game, month, year, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT m.*, tn.name as tournament_name, 
             wt.name as winning_team_name, wt.logo_url as winning_team_logo,
             rt.name as runner_up_team_name,
             mp.real_name as mvp_player_name, mp.in_game_name as mvp_in_game_name
      FROM matches m
      LEFT JOIN tournaments tn ON m.tournament_id = tn.id
      LEFT JOIN teams wt ON m.winning_team_id = wt.id
      LEFT JOIN teams rt ON m.runner_up_team_id = rt.id
      LEFT JOIN players mp ON m.mvp_player_id = mp.id
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
    if (game) {
      sql += ' AND m.game = ?';
      params.push(game);
    }
    if (month && year) {
      const formattedMonth = month.padStart(2, '0');
      sql += ' AND m.date LIKE ?';
      params.push(`${year}-${formattedMonth}-%`);
    } else if (year) {
      sql += ' AND m.date LIKE ?';
      params.push(`${year}-%`);
    }

    if (search) {
      sql += ` AND (m.match_name LIKE ? OR tn.name LIKE ? OR wt.name LIKE ? OR mp.in_game_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    const countSql = sql.replace(/SELECT m\.\*.*FROM/s, 'SELECT COUNT(*) as total FROM');
    const total = db.get(countSql, params)?.total || 0;

    sql += ' ORDER BY m.date DESC, m.match_number DESC LIMIT ? OFFSET ?';
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
router.post('/', authenticate, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'poster', maxCount: 1 }]), (req, res) => {
  try {
    const db = getDb();
    const { 
      tournament_id, match_name, match_number, game, date, time, venue, 
      description, status, winning_team_id, runner_up_team_id, mvp_player_id, 
      notes, highlights_url, published 
    } = req.body;

    if (!tournament_id || !match_number) {
      return res.status(400).json({ error: 'Tournament ID and Match Number are required.' });
    }

    const thumbnail_url = req.files?.thumbnail ? `/uploads/${req.files.thumbnail[0].filename}` : null;
    const poster_url = req.files?.poster ? `/uploads/${req.files.poster[0].filename}` : null;

    db.run(
      `INSERT INTO matches (
        tournament_id, match_name, match_number, game, date, time, venue, 
        description, status, winning_team_id, runner_up_team_id, mvp_player_id, 
        notes, highlights_url, published, thumbnail_url, poster_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(tournament_id),
        match_name || null,
        Number(match_number),
        game || null,
        date || null,
        time || null,
        venue || null,
        description || null,
        status || 'upcoming',
        winning_team_id ? Number(winning_team_id) : null,
        runner_up_team_id ? Number(runner_up_team_id) : null,
        mvp_player_id ? Number(mvp_player_id) : null,
        notes || null,
        highlights_url || null,
        published !== undefined ? Number(published) : 1,
        thumbnail_url,
        poster_url
      ]
    );

    const id = db.getLastInsertRowId();
    const match = db.get('SELECT * FROM matches WHERE id = ?', [id]);
    
    if (req.admin && req.admin.admin_id) {
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [req.admin.admin_id, 'CREATE_MATCH', `Created match ${match_number} for tournament ${tournament_id}`, req.ip]
      );
    }

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

// PUT /api/matches/:id - update match (admin)
router.put('/:id', authenticate, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'poster', maxCount: 1 }]), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { 
      tournament_id, match_name, match_number, game, date, time, venue, 
      description, status, winning_team_id, runner_up_team_id, mvp_player_id, 
      notes, highlights_url, published 
    } = req.body;

    const match = db.get('SELECT * FROM matches WHERE id = ?', [Number(id)]);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    const thumbnail_url = req.files?.thumbnail ? `/uploads/${req.files.thumbnail[0].filename}` : match.thumbnail_url;
    const poster_url = req.files?.poster ? `/uploads/${req.files.poster[0].filename}` : match.poster_url;

    db.run(
      `UPDATE matches SET
         tournament_id = ?, match_name = ?, match_number = ?, game = ?, date = ?, time = ?, venue = ?, 
         description = ?, status = ?, winning_team_id = ?, runner_up_team_id = ?, mvp_player_id = ?, 
         notes = ?, highlights_url = ?, published = ?, thumbnail_url = ?, poster_url = ?
       WHERE id = ?`,
      [
        tournament_id ? Number(tournament_id) : match.tournament_id,
        match_name !== undefined ? match_name : match.match_name,
        match_number ? Number(match_number) : match.match_number,
        game !== undefined ? game : match.game,
        date !== undefined ? date : match.date,
        time !== undefined ? time : match.time,
        venue !== undefined ? venue : match.venue,
        description !== undefined ? description : match.description,
        status || match.status,
        winning_team_id !== undefined ? (winning_team_id ? Number(winning_team_id) : null) : match.winning_team_id,
        runner_up_team_id !== undefined ? (runner_up_team_id ? Number(runner_up_team_id) : null) : match.runner_up_team_id,
        mvp_player_id !== undefined ? (mvp_player_id ? Number(mvp_player_id) : null) : match.mvp_player_id,
        notes !== undefined ? notes : match.notes,
        highlights_url !== undefined ? highlights_url : match.highlights_url,
        published !== undefined ? Number(published) : match.published,
        thumbnail_url,
        poster_url,
        Number(id)
      ]
    );

    const updated = db.get('SELECT * FROM matches WHERE id = ?', [Number(id)]);
    
    if (req.admin && req.admin.admin_id) {
      db.run(
        'INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [req.admin.admin_id, 'UPDATE_MATCH', `Updated match ${id}`, req.ip]
      );
    }
    
    broadcastEvent('entity_update', { entity: 'matches' });

    res.json({ message: 'Match updated successfully.', match: updated });
  } catch (err) {
    console.error('Update match error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/matches/:id - delete match (admin)
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const match = db.get('SELECT * FROM matches WHERE id = ?', [Number(id)]);
    if (!match) return res.status(404).json({ error: 'Match not found.' });

    db.transaction(() => {
      db.run('DELETE FROM results WHERE match_id = ?', [Number(id)]);
      db.run('DELETE FROM player_results WHERE match_id = ?', [Number(id)]);
      db.run('DELETE FROM matches WHERE id = ?', [Number(id)]);
    });

    broadcastEvent('entity_update', { entity: 'matches' });
    res.json({ message: 'Match deleted successfully.' });
  } catch (err) {
    console.error('Delete match error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

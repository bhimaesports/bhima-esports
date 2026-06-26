import { Router } from 'express';
import { getDb } from '../db/schema.js';

const router = Router();

// ─── GET /api/public/teams — Top teams with stats ────────────────────────────
router.get('/teams', (req, res) => {
  try {
    const db = getDb();
    const { limit = 20, sort = 'points' } = req.query;

    let orderBy = 'COALESCE(lb.total_points, 0) DESC';
    if (sort === 'wins') orderBy = 'COALESCE(lb.wins, 0) DESC';
    if (sort === 'kills') orderBy = 'COALESCE(lb.total_kills, 0) DESC';

    const teams = db.all(`
      SELECT 
        t.id, t.team_id, t.name, t.logo_url, t.captain_name, t.motto, t.status,
        d.name as department_name, d.code as department_code,
        COALESCE(lb.matches, 0) as matches_played,
        COALESCE(lb.wins, 0) as wins,
        COALESCE(lb.total_kills, 0) as total_kills,
        COALESCE(lb.total_points, 0) as total_points,
        COALESCE(lb.current_rank, 0) as rank,
        (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id AND p.status = 'active') as player_count
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN team_leaderboard lb ON lb.team_id = t.id
      WHERE t.status = 'active'
      ORDER BY ${orderBy}
      LIMIT ?
    `, [Number(limit)]);

    res.json({ teams });
  } catch (err) {
    console.error('Public teams error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/public/teams/:id — Full team profile ──────────────────────────
router.get('/teams/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const team = db.get(`
      SELECT 
        t.*, 
        d.name as department_name, d.code as department_code,
        COALESCE(lb.matches, 0) as matches_played,
        COALESCE(lb.wins, 0) as wins,
        COALESCE(lb.total_kills, 0) as total_kills,
        COALESCE(lb.total_points, 0) as total_points,
        COALESCE(lb.current_rank, 0) as rank
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN team_leaderboard lb ON lb.team_id = t.id
      WHERE t.id = ? AND t.status = 'active'
    `, [Number(id)]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Get players
    const players = db.all(`
      SELECT 
        p.id, p.name, p.uid, p.roll_number, p.status, p.kills, p.wins, 
        p.matches_played, p.total_points, p.mvp_awards, p.total_damage,
        p.headshot_percentage, p.average_survival_time, p.booyahs,
        d.name as department_name
      FROM players p
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.team_id = ? AND p.status = 'active'
      ORDER BY p.total_points DESC
    `, [Number(id)]);

    // Determine captain
    const playersWithRole = players.map(p => ({
      ...p,
      role: p.name === team.captain_name ? 'Captain' : 'Player',
      kd_ratio: p.matches_played > 0 ? (p.kills / p.matches_played).toFixed(2) : '0.00',
    }));

    // Match history for charts
    const matchHistory = db.all(`
      SELECT r.rank, r.kills, r.total_points, r.placement_points, r.kill_points,
             m.match_number, m.date, tn.name as tournament_name
      FROM results r
      JOIN matches m ON r.match_id = m.id
      JOIN tournaments tn ON m.tournament_id = tn.id
      WHERE r.team_id = ?
      ORDER BY m.date ASC, m.match_number ASC
    `, [Number(id)]);

    let cumulativePoints = 0;
    const chartData = matchHistory.map((m, i) => {
      cumulativePoints += m.total_points;
      return {
        name: `M${i + 1}`,
        rank: m.rank,
        kills: m.kills,
        points: m.total_points,
        cumulative: cumulativePoints,
        tournament: m.tournament_name,
      };
    });

    const winRate = team.matches_played > 0
      ? ((team.wins / team.matches_played) * 100).toFixed(1)
      : '0.0';

    res.json({
      team: { ...team, win_rate: winRate },
      players: playersWithRole,
      matchHistory: chartData,
    });
  } catch (err) {
    console.error('Public team profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/public/players — Top players ───────────────────────────────────
router.get('/players', (req, res) => {
  try {
    const db = getDb();
    const { limit = 20, sort = 'points' } = req.query;

    let orderBy = 'p.total_points DESC';
    if (sort === 'kills') orderBy = 'p.kills DESC';
    if (sort === 'mvp') orderBy = 'p.mvp_awards DESC';
    if (sort === 'wins') orderBy = 'p.wins DESC';

    const players = db.all(`
      SELECT 
        p.id, p.name, p.uid, p.kills, p.wins, p.matches_played, 
        p.total_points, p.mvp_awards, p.total_damage, p.headshot_percentage,
        p.average_survival_time, p.booyahs,
        t.name as team_name, t.id as team_id, t.logo_url as team_logo,
        d.name as department_name, d.code as department_code
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.status = 'active'
      ORDER BY ${orderBy}
      LIMIT ?
    `, [Number(limit)]);

    const enriched = players.map(p => ({
      ...p,
      kd_ratio: p.matches_played > 0 ? (p.kills / p.matches_played).toFixed(2) : '0.00',
    }));

    res.json({ players: enriched });
  } catch (err) {
    console.error('Public players error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/public/players/:id — Full player profile ──────────────────────
router.get('/players/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const player = db.get(`
      SELECT 
        p.*,
        t.name as team_name, t.id as team_id, t.logo_url as team_logo, t.captain_name,
        d.name as department_name, d.code as department_code
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.id = ? AND p.status = 'active'
    `, [Number(id)]);

    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    player.role = player.name === player.captain_name ? 'Captain' : 'Player';
    player.kd_ratio = player.matches_played > 0 ? (player.kills / player.matches_played).toFixed(2) : '0.00';

    // Match history for charts
    const matchHistory = db.all(`
      SELECT pr.kills, pr.damage, pr.headshots, pr.survival_time, pr.points,
             m.match_number, m.date, tn.name as tournament_name
      FROM player_results pr
      JOIN matches m ON pr.match_id = m.id
      JOIN tournaments tn ON m.tournament_id = tn.id
      WHERE pr.player_id = ?
      ORDER BY m.date ASC, m.match_number ASC
    `, [Number(id)]);

    let cumulativePoints = 0;
    const chartData = matchHistory.map((m, i) => {
      cumulativePoints += m.points;
      return {
        name: `M${i + 1}`,
        kills: m.kills,
        damage: m.damage,
        points: m.points,
        cumulative: cumulativePoints,
        tournament: m.tournament_name,
      };
    });

    // Achievements
    const certificates = db.all(
      `SELECT * FROM certificates WHERE player_id = ? AND status = 'active' ORDER BY issued_date DESC`,
      [Number(id)]
    );

    res.json({
      player,
      matchHistory: chartData,
      achievements: certificates,
    });
  } catch (err) {
    console.error('Public player profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/public/leaderboards — Combined leaderboard data ───────────────
router.get('/leaderboards', (req, res) => {
  try {
    const db = getDb();

    // Top Teams
    const topTeams = db.all(`
      SELECT t.id, t.name, t.logo_url,
             d.code as department_code,
             COALESCE(lb.total_points, 0) as total_points,
             COALESCE(lb.wins, 0) as wins,
             COALESCE(lb.total_kills, 0) as total_kills,
             COALESCE(lb.current_rank, 0) as rank
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN team_leaderboard lb ON lb.team_id = t.id
      WHERE t.status = 'active'
      ORDER BY COALESCE(lb.total_points, 0) DESC
      LIMIT 10
    `);

    // Top Players by Points
    const topPlayers = db.all(`
      SELECT p.id, p.name, p.kills, p.total_points, p.matches_played, p.mvp_awards,
             t.name as team_name, d.code as department_code
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.status = 'active'
      ORDER BY p.total_points DESC
      LIMIT 10
    `);

    // Highest Kill Leaders
    const killLeaders = db.all(`
      SELECT p.id, p.name, p.kills, p.matches_played, p.total_points,
             t.name as team_name, d.code as department_code
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.status = 'active'
      ORDER BY p.kills DESC
      LIMIT 10
    `);

    // MVP Players
    const mvpPlayers = db.all(`
      SELECT p.id, p.name, p.mvp_awards, p.kills, p.total_points,
             t.name as team_name, d.code as department_code
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.status = 'active' AND p.mvp_awards > 0
      ORDER BY p.mvp_awards DESC
      LIMIT 10
    `);

    // Rising Stars (newest players with stats)
    const risingStars = db.all(`
      SELECT p.id, p.name, p.kills, p.total_points, p.matches_played, p.wins,
             t.name as team_name, d.code as department_code
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    res.json({
      topTeams,
      topPlayers: topPlayers.map(p => ({ ...p, kd_ratio: p.matches_played > 0 ? (p.kills / p.matches_played).toFixed(2) : '0.00' })),
      killLeaders: killLeaders.map(p => ({ ...p, kd_ratio: p.matches_played > 0 ? (p.kills / p.matches_played).toFixed(2) : '0.00' })),
      mvpPlayers,
      risingStars: risingStars.map(p => ({ ...p, kd_ratio: p.matches_played > 0 ? (p.kills / p.matches_played).toFixed(2) : '0.00' })),
    });
  } catch (err) {
    console.error('Public leaderboards error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── GET /api/public/search — Global search ─────────────────────────────────
router.get('/search', (req, res) => {
  try {
    const db = getDb();
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ teams: [], players: [] });
    }

    const s = `%${q.trim()}%`;

    const teams = db.all(`
      SELECT t.id, t.name, t.logo_url, t.captain_name,
             d.name as department_name, d.code as department_code,
             COALESCE(lb.total_points, 0) as total_points,
             COALESCE(lb.current_rank, 0) as rank,
             (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) as player_count
      FROM teams t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN team_leaderboard lb ON lb.team_id = t.id
      WHERE t.status = 'active' AND (t.name LIKE ? OR t.team_id LIKE ? OR d.name LIKE ? OR d.code LIKE ?)
      ORDER BY COALESCE(lb.total_points, 0) DESC
      LIMIT 20
    `, [s, s, s, s]);

    const players = db.all(`
      SELECT p.id, p.name, p.uid, p.kills, p.total_points, p.matches_played, p.mvp_awards,
             t.name as team_name, t.id as team_id,
             d.name as department_name, d.code as department_code
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.status = 'active' AND (p.name LIKE ? OR p.uid LIKE ? OR p.roll_number LIKE ? OR d.name LIKE ? OR d.code LIKE ?)
      ORDER BY p.total_points DESC
      LIMIT 20
    `, [s, s, s, s, s]);

    res.json({ teams, players });
  } catch (err) {
    console.error('Public search error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

import { Router } from 'express';
import { getDb } from '../db/schema.js';

const router = Router();

// GET /api/stats - dashboard statistics
router.get('/', (req, res) => {
  try {
    const db = getDb();

    // Total teams
    const totalTeams = db.get('SELECT COUNT(*) as count FROM teams')?.count || 0;
    const activeTeams = db.get("SELECT COUNT(*) as count FROM teams WHERE status = 'active'")?.count || 0;
    const bannedTeams = db.get("SELECT COUNT(*) as count FROM teams WHERE status = 'banned'")?.count || 0;

    // Total players
    const totalPlayers = db.get('SELECT COUNT(*) as count FROM players')?.count || 0;
    const activePlayers = db.get("SELECT COUNT(*) as count FROM players WHERE status = 'active'")?.count || 0;

    // Tournaments
    const totalTournaments = db.get('SELECT COUNT(*) as count FROM tournaments')?.count || 0;
    const liveTournaments = db.get("SELECT COUNT(*) as count FROM tournaments WHERE status = 'live'")?.count || 0;
    const openTournaments = db.get("SELECT COUNT(*) as count FROM tournaments WHERE status = 'open'")?.count || 0;
    const completedTournaments = db.get("SELECT COUNT(*) as count FROM tournaments WHERE status = 'completed'")?.count || 0;

    // Registrations
    const totalRegistrations = db.get('SELECT COUNT(*) as count FROM registrations')?.count || 0;
    const pendingRegistrations = db.get("SELECT COUNT(*) as count FROM registrations WHERE status = 'pending'")?.count || 0;
    const approvedRegistrations = db.get("SELECT COUNT(*) as count FROM registrations WHERE status = 'approved'")?.count || 0;

    // Matches
    const totalMatches = db.get('SELECT COUNT(*) as count FROM matches')?.count || 0;
    const completedMatches = db.get("SELECT COUNT(*) as count FROM matches WHERE status = 'completed'")?.count || 0;
    const upcomingMatches = db.get("SELECT COUNT(*) as count FROM matches WHERE status = 'upcoming'")?.count || 0;
    const liveMatches = db.get("SELECT COUNT(*) as count FROM matches WHERE status = 'live'")?.count || 0;

    // Certificates
    const totalCertificates = db.get('SELECT COUNT(*) as count FROM certificates')?.count || 0;

    // Department breakdown
    const departmentStats = db.all(
      `SELECT d.code, d.name,
              COUNT(DISTINCT t.id) as teams,
              COUNT(DISTINCT p.id) as players
       FROM departments d
       LEFT JOIN teams t ON t.department_id = d.id
       LEFT JOIN players p ON p.department_id = d.id
       GROUP BY d.id
       ORDER BY d.code`
    );

    // Top teams
    const topTeams = db.all(
      `SELECT tl.*, t.name as team_name, t.team_id as team_code, d.code as department_code
       FROM team_leaderboard tl
       LEFT JOIN teams t ON tl.team_id = t.id
       LEFT JOIN departments d ON t.department_id = d.id
       ORDER BY tl.total_points DESC
       LIMIT 5`
    );

    // Recent registrations
    const recentRegistrations = db.all(
      `SELECT r.*, t.name as team_name, t.team_id as team_code, tn.name as tournament_name
       FROM registrations r
       LEFT JOIN teams t ON r.team_id = t.id
       LEFT JOIN tournaments tn ON r.tournament_id = tn.id
       ORDER BY r.created_at DESC
       LIMIT 5`
    );

    // Recent admin activity
    const recentLogs = db.all(
      'SELECT * FROM admin_logs ORDER BY timestamp DESC LIMIT 10'
    );

    res.json({
      stats: {
        teams: { total: totalTeams, active: activeTeams, banned: bannedTeams },
        players: { total: totalPlayers, active: activePlayers },
        tournaments: {
          total: totalTournaments,
          live: liveTournaments,
          open: openTournaments,
          completed: completedTournaments,
        },
        registrations: {
          total: totalRegistrations,
          pending: pendingRegistrations,
          approved: approvedRegistrations,
        },
        matches: {
          total: totalMatches,
          completed: completedMatches,
          upcoming: upcomingMatches,
          live: liveMatches,
        },
        certificates: totalCertificates,
      },
      departmentStats,
      topTeams,
      recentRegistrations,
      recentLogs,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

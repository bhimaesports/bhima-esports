import { getDb } from '../db/schema.js';

/**
 * Get placement points for a given rank from the point distribution table.
 */
export function getPlacementPoints(rank) {
  const db = getDb();
  const pdRow = db.get('SELECT data FROM point_distributions ORDER BY id DESC LIMIT 1');
  if (!pdRow) return { placementPoints: 0, killPointValue: 1 };

  const pd = JSON.parse(pdRow.data);
  const killPointValue = pd.kill_point_value || 1;
  const placement = pd.placements.find((p) => p.rank === rank);
  const placementPoints = placement ? placement.points : 0;

  return { placementPoints, killPointValue };
}

/**
 * Calculate total points for a match result entry.
 */
export function calculatePoints(rank, kills) {
  const { placementPoints, killPointValue } = getPlacementPoints(rank);
  const killPoints = kills * killPointValue;
  const totalPoints = placementPoints + killPoints;

  return {
    placement_points: placementPoints,
    kill_points: killPoints,
    total_points: totalPoints,
  };
}

/**
 * Update team leaderboard after match results are entered.
 * Saves previous rank/points before updating.
 */
export function updateTeamLeaderboard(teamId, kills, totalPoints, isWin) {
  const db = getDb();

  const existing = db.get('SELECT * FROM team_leaderboard WHERE team_id = ?', [teamId]);

  if (existing) {
    db.run(
      `UPDATE team_leaderboard
       SET prev_points = total_points,
           prev_rank = current_rank,
           matches = matches + 1,
           wins = wins + ?,
           total_kills = total_kills + ?,
           total_points = total_points + ?
       WHERE team_id = ?`,
      [isWin ? 1 : 0, kills, totalPoints, teamId]
    );
  } else {
    db.run(
      `INSERT INTO team_leaderboard (team_id, matches, wins, total_kills, total_points)
       VALUES (?, 1, ?, ?, ?)`,
      [teamId, isWin ? 1 : 0, kills, totalPoints]
    );
  }
}

/**
 * Recalculate all team ranks based on total_points (desc).
 */
export function recalculateTeamRanks() {
  const db = getDb();
  const teams = db.all('SELECT id, team_id FROM team_leaderboard ORDER BY total_points DESC');

  for (let i = 0; i < teams.length; i++) {
    db.run('UPDATE team_leaderboard SET current_rank = ? WHERE id = ?', [i + 1, teams[i].id]);
  }
}

/**
 * Update department leaderboard by aggregating all team data per department.
 */
export function updateDeptLeaderboard() {
  const db = getDb();

  // Get all departments
  const departments = db.all('SELECT id FROM departments');

  for (const dept of departments) {
    // Aggregate from team_leaderboard joined with teams
    const stats = db.get(
      `SELECT
         COALESCE(SUM(tl.wins), 0) as wins,
         COUNT(DISTINCT t.id) as teams_participated,
         COALESCE(SUM(tl.total_points), 0) as total_points
       FROM teams t
       JOIN team_leaderboard tl ON tl.team_id = t.id
       WHERE t.department_id = ?`,
      [dept.id]
    );

    const existing = db.get('SELECT * FROM dept_leaderboard WHERE department_id = ?', [dept.id]);
    if (existing) {
      db.run(
        `UPDATE dept_leaderboard
         SET prev_points = total_points,
             prev_rank = current_rank,
             wins = ?,
             teams_participated = ?,
             total_points = ?
         WHERE department_id = ?`,
        [stats.wins, stats.teams_participated, stats.total_points, dept.id]
      );
    } else {
      db.run(
        `INSERT INTO dept_leaderboard (department_id, wins, teams_participated, total_points)
         VALUES (?, ?, ?, ?)`,
        [dept.id, stats.wins, stats.teams_participated, stats.total_points]
      );
    }
  }

  // Recalculate department ranks
  const depts = db.all('SELECT id FROM dept_leaderboard ORDER BY total_points DESC');
  for (let i = 0; i < depts.length; i++) {
    db.run('UPDATE dept_leaderboard SET current_rank = ? WHERE id = ?', [i + 1, depts[i].id]);
  }
}

export default {
  getPlacementPoints,
  calculatePoints,
  updateTeamLeaderboard,
  recalculateTeamRanks,
  updateDeptLeaderboard,
};

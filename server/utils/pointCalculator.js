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

export function recalculateAllPoints() {
  const db = getDb();
  const { killPointValue, placementPoints } = getPlacementPoints(1); // Rank 1 points for wins/booyahs

  // 1. Recalculate all players
  const players = db.all('SELECT * FROM players');
  for (const player of players) {
    const kPoints = (player.kills || 0) * killPointValue;
    // wins or booyahs count as rank 1
    const wPoints = ((player.wins || 0) + (player.booyahs || 0)) * placementPoints; 
    const mvpPoints = (player.mvp_awards || 0) * 5; // Example arbitrary 5 pts for MVP if no schema exists for it
    const totalPoints = kPoints + wPoints + mvpPoints;

    db.run(
      'UPDATE players SET total_points = ? WHERE id = ?',
      [totalPoints, player.id]
    );

    // Also update player_leaderboard if entries exist
    db.run(
      'UPDATE player_leaderboard SET total_points = ?, kills = ?, wins = ?, matches = ? WHERE player_id = ?',
      [totalPoints, player.kills, player.wins, player.matches_played, player.id]
    );
  }

  // 2. Recalculate Teams based on sum of players
  const teams = db.all('SELECT id FROM teams');
  for (const team of teams) {
    const sum = db.get('SELECT SUM(total_points) as tp, SUM(kills) as tk, SUM(wins) as tw, SUM(matches_played) as tm FROM players WHERE team_id = ? AND status="active"', [team.id]);
    
    // Update team leaderboard
    const existingTl = db.get('SELECT id FROM team_leaderboard WHERE team_id = ?', [team.id]);
    if (existingTl) {
      db.run(
        'UPDATE team_leaderboard SET total_points = ?, total_kills = ?, wins = ?, matches = ? WHERE team_id = ?',
        [sum.tp || 0, sum.tk || 0, sum.tw || 0, sum.tm || 0, team.id]
      );
    } else {
      db.run(
        'INSERT INTO team_leaderboard (team_id, total_points, total_kills, wins, matches) VALUES (?, ?, ?, ?, ?)',
        [team.id, sum.tp || 0, sum.tk || 0, sum.tw || 0, sum.tm || 0]
      );
    }
  }

  // 3. Recalculate Departments based on sum of teams
  const depts = db.all('SELECT id FROM departments');
  for (const dept of depts) {
    const sum = db.get(
      `SELECT SUM(tl.total_points) as tp, SUM(tl.wins) as tw, COUNT(DISTINCT t.id) as tc 
       FROM team_leaderboard tl 
       JOIN teams t ON tl.team_id = t.id 
       WHERE t.department_id = ? AND t.status="active"`, 
       [dept.id]
    );

    const existingDl = db.get('SELECT id FROM dept_leaderboard WHERE department_id = ?', [dept.id]);
    if (existingDl) {
      db.run(
        'UPDATE dept_leaderboard SET total_points = ?, wins = ?, teams_participated = ? WHERE department_id = ?',
        [sum.tp || 0, sum.tw || 0, sum.tc || 0, dept.id]
      );
    } else {
      db.run(
        'INSERT INTO dept_leaderboard (department_id, total_points, wins, teams_participated) VALUES (?, ?, ?, ?)',
        [dept.id, sum.tp || 0, sum.tw || 0, sum.tc || 0]
      );
    }
  }

  // 4. Update Rankings
  recalculateTeamRanks();
  
  const deptRanks = db.all('SELECT id FROM dept_leaderboard ORDER BY total_points DESC');
  for (let i = 0; i < deptRanks.length; i++) {
    db.run('UPDATE dept_leaderboard SET current_rank = ? WHERE id = ?', [i + 1, deptRanks[i].id]);
  }
}

export default {
  getPlacementPoints,
  calculatePoints,
  updateTeamLeaderboard,
  recalculateTeamRanks,
  updateDeptLeaderboard,
  recalculateAllPoints,
};

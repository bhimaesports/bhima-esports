import { initializeDatabase, getDb } from './db/schema.js';

async function clearData() {
  await initializeDatabase();
  const db = getDb();
  
  console.log('Clearing test data from bhima_esports.sqlite...');
  
  db.run('DELETE FROM players');
  db.run('DELETE FROM teams');
  db.run('DELETE FROM matches');
  db.run('DELETE FROM results');
  db.run('DELETE FROM player_results');
  db.run('DELETE FROM tournaments');
  db.run('DELETE FROM team_leaderboard');
  db.run('DELETE FROM registrations');
  db.run('DELETE FROM certificates');
  db.run('DELETE FROM achievements');
  db.run('DELETE FROM admin_logs');

  console.log('Test data cleared successfully.');
  
  setTimeout(() => {
      console.log('Exiting...');
      process.exit(0);
  }, 1500);
}

clearData().catch(console.error);

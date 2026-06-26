import { initializeDatabase, getDb } from './db/schema.js';

async function migrate() {
  await initializeDatabase();
  const db = getDb();
  
  console.log('Migrating database for new critical features...');
  
  try {
    db.run("ALTER TABLE announcements ADD COLUMN image_url TEXT");
    db.run("ALTER TABLE announcements ADD COLUMN scheduled_for TEXT");
  } catch(e) {
    console.log("Columns may already exist in announcements.");
  }

  // flash_news and player_leaderboard were added to schema.js, so initializeDatabase() just created them.
  
  console.log('Migration complete.');
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

migrate().catch(console.error);

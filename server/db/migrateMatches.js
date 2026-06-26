import { initializeDatabase, getDb } from './schema.js';

initializeDatabase();
const db = getDb();

console.log('Migrating matches table...');
const columns = [
  'match_name TEXT',
  'game TEXT',
  'time TEXT',
  'winning_team_id INTEGER',
  'runner_up_team_id INTEGER',
  'mvp_player_id INTEGER',
  'poster_url TEXT',
  'notes TEXT',
  'highlights_url TEXT',
  'published INTEGER DEFAULT 1'
];

columns.forEach(col => {
  try {
    db.prepare(`ALTER TABLE matches ADD COLUMN ${col}`).run();
    console.log(`Successfully added ${col}`);
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log(`Column ${col} already exists.`);
    } else {
      console.error(`Error adding column ${col}:`, err.message);
    }
  }
});

console.log('Migration complete.');

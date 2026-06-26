const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bhima_esports.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
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
    db.run(`ALTER TABLE matches ADD COLUMN ${col}`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`Column ${col} already exists.`);
        } else {
          console.error(`Error adding column ${col}:`, err.message);
        }
      } else {
        console.log(`Successfully added ${col}`);
      }
    });
  });
});

db.close(() => console.log('Migration complete.'));

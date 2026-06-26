import bcrypt from 'bcryptjs';
import { initializeDatabase, getDb } from './server/db/schema.js';

async function test() {
  await initializeDatabase();
  const db = getDb();
  
  try {
    const hash = bcrypt.hashSync('testpassword', 10);
    // Let's create a dummy player first to test update
    db.run("INSERT INTO players (name, department_id) VALUES ('TestPlayer', 1)");
    const player = db.get("SELECT id FROM players WHERE name = 'TestPlayer'");
    console.log("Created player:", player.id);
    
    const updates = ['player_login_id = ?', 'password_hash = ?'];
    const params = ['test_login', hash, player.id];
    
    db.run(`UPDATE players SET ${updates.join(', ')} WHERE id = ?`, params);
    console.log("Update successful");
    
  } catch (err) {
    console.error("Update failed:", err);
  }
}

test().catch(console.error);

import bcrypt from 'bcryptjs';
import { initializeDatabase, getDb } from './server/db/schema.js';

async function resetAdmin() {
  await initializeDatabase();
  const db = getDb();
  const hash = bcrypt.hashSync('bhima2026', 10);
  
  const admin = db.get("SELECT * FROM admins WHERE id = 1");
  if (!admin) {
    db.run("INSERT INTO admins (id, admin_id, password_hash) VALUES (1, 'admin', ?)", [hash]);
  } else {
    db.run("UPDATE admins SET admin_id = 'admin', password_hash = ? WHERE id = 1", [hash]);
  }
  
  console.log("Admin credentials reset: admin / bhima2026");
}

resetAdmin().catch(console.error);

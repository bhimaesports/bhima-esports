import bcrypt from 'bcryptjs';
import { initializeDatabase, getDb } from './server/db/schema.js';

async function checkAdmin() {
  await initializeDatabase();
  const db = getDb();
  
  const admins = db.all("SELECT * FROM admins");
  console.log("All Admins in DB:", admins);
  
  if (admins.length > 0) {
    const admin = admins[0];
    const passwordMatch = bcrypt.compareSync('bhima2026', admin.password_hash);
    console.log("Does 'bhima2026' match the hash? ", passwordMatch);
  }
}

checkAdmin().catch(console.error);

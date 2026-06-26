import initSqlJs from 'sql.js';
import fs from 'fs';

async function run() {
  const SQL = await initSqlJs();
  const dbFile = fs.readFileSync('server/db/bhima_esports.sqlite');
  const db = new SQL.Database(dbFile);

  const cols = db.exec("PRAGMA table_info(certificates)")[0].values.map(v => v[1]);
  const colNames = cols.join(', ');

  db.run("ALTER TABLE certificates RENAME TO certificates_old");

  db.run(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      player_id INTEGER,
      player_name TEXT NOT NULL,
      roll_number TEXT,
      team_name TEXT,
      department TEXT,
      tournament_name TEXT,
      tournament_date TEXT,
      issued_date TEXT DEFAULT (date('now')),
      pdf_path TEXT,
      achievement_badge TEXT,
      achievement_level TEXT,
      status TEXT DEFAULT 'active',
      revocation_reason TEXT,
      reissued_from TEXT,
      template_id INTEGER,
      title TEXT,
      description_text TEXT,
      signature_name TEXT,
      signature_designation TEXT,
      signature_image TEXT,
      signature_name_2 TEXT,
      signature_designation_2 TEXT,
      signature_image_2 TEXT,
      colors TEXT,
      typography TEXT,
      logo_url TEXT,
      logo_size INTEGER DEFAULT 80,
      logo_position TEXT DEFAULT 'top',
      seal_url TEXT,
      watermark_text TEXT,
      border_design TEXT,
      qr_code_enabled INTEGER DEFAULT 1,
      sponsor_logos TEXT,
      position TEXT,
      award_type TEXT
    )
  `);

  db.run(`INSERT INTO certificates (${colNames}) SELECT ${colNames} FROM certificates_old`);
  db.run("DROP TABLE certificates_old");

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync('server/db/bhima_esports.sqlite', buffer);
  
  console.log('Migration completed successfully. CHECK constraint removed.');
}

run().catch(console.error);

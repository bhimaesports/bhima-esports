import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { dirname } from 'path';

const DB_PATH = path.join(__dirname, 'bhima_esports.sqlite');

let db = null;

// ─── Database wrapper providing a simpler API over sql.js ────────────────────

class Database {
  constructor(sqlDb) {
    this._db = sqlDb;
    this._saveTimeout = null;
  }

  // Schedule a debounced save (50ms) so rapid writes don't hammer the disk
  // NOTE: Changed to synchronous save to guarantee permanent data persistence.
  _scheduleSave() {
    this.saveToFile();
  }

  // Persist database to disk immediately
  saveToFile() {
    try {
      const data = this._db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }

  // Execute DDL or DML without returning rows.  Params are optional.
  run(sql, params = []) {
    this._db.run(sql, params);
    this._scheduleSave();
    return this;
  }

  // Execute a query and return an array of plain objects (one per row).
  all(sql, params = []) {
    const stmt = this._db.prepare(sql);
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  // Execute a query and return the first row as a plain object, or undefined.
  get(sql, params = []) {
    const rows = this.all(sql, params);
    return rows.length > 0 ? rows[0] : undefined;
  }

  // Execute raw sql.js exec (useful for multi-statement DDL)
  exec(sql) {
    this._db.exec(sql);
    this._scheduleSave();
  }

  // Get the last inserted rowid
  getLastInsertRowId() {
    const row = this.get('SELECT last_insert_rowid() as id');
    return row ? row.id : null;
  }

  // Get changes count from last operation
  getChanges() {
    const row = this.get('SELECT changes() as count');
    return row ? row.count : 0;
  }

  // Transaction helper
  transaction(fn) {
    this._db.run('BEGIN TRANSACTION');
    try {
      const result = fn();
      this._db.run('COMMIT');
      this._scheduleSave();
      return result;
    } catch (err) {
      this._db.run('ROLLBACK');
      throw err;
    }
  }
}

// ─── Schema creation ─────────────────────────────────────────────────────────

function createTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      banner_url TEXT,
      color TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      year INTEGER,
      captain_name TEXT,
      captain_roll TEXT,
      captain_phone TEXT,
      leader_uid TEXT,
      leader_ign TEXT,
      logo_url TEXT,
      motto TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','suspended','banned')),
      ban_reason TEXT,
      ban_date TEXT,
      banned_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      team_id INTEGER,
      uid TEXT,
      year INTEGER,
      roll_number TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','suspended','banned')),
      kills INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      matches_played INTEGER DEFAULT 0,
      mvp_awards INTEGER DEFAULT 0,
      total_damage INTEGER DEFAULT 0,
      headshot_percentage REAL DEFAULT 0,
      average_survival_time REAL DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      booyahs INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      photo_url TEXT,
      jersey_url TEXT,
      banner_url TEXT,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      poster_url TEXT,
      date TEXT,
      time TEXT,
      registration_deadline TEXT,
      team_slots INTEGER DEFAULT 20,
      registered_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','open','live','completed','cancelled')),
      rules TEXT,
      prize_details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_number TEXT UNIQUE NOT NULL,
      team_id INTEGER NOT NULL,
      tournament_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      match_name TEXT,
      match_number INTEGER NOT NULL,
      game TEXT,
      date TEXT,
      time TEXT,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming','live','completed','cancelled')),
      winning_team_id INTEGER,
      runner_up_team_id INTEGER,
      mvp_player_id INTEGER,
      poster_url TEXT,
      notes TEXT,
      highlights_url TEXT,
      published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (winning_team_id) REFERENCES teams(id),
      FOREIGN KEY (runner_up_team_id) REFERENCES teams(id),
      FOREIGN KEY (mvp_player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      rank INTEGER,
      kills INTEGER DEFAULT 0,
      placement_points INTEGER DEFAULT 0,
      kill_points INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      FOREIGN KEY (match_id) REFERENCES matches(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS player_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      kills INTEGER DEFAULT 0,
      damage INTEGER DEFAULT 0,
      headshots INTEGER DEFAULT 0,
      survival_time REAL DEFAULT 0,
      points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (match_id) REFERENCES matches(id),
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS team_leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER UNIQUE NOT NULL,
      matches INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      total_kills INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      prev_points INTEGER DEFAULT 0,
      prev_rank INTEGER DEFAULT 0,
      current_rank INTEGER DEFAULT 0,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS dept_leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER UNIQUE NOT NULL,
      wins INTEGER DEFAULT 0,
      teams_participated INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      prev_points INTEGER DEFAULT 0,
      prev_rank INTEGER DEFAULT 0,
      current_rank INTEGER DEFAULT 0,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

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
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      award_type TEXT NOT NULL,
      tournament_name TEXT,
      issued_date TEXT DEFAULT (date('now')),
      pdf_path TEXT,
      achievement_code TEXT UNIQUE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'info' CHECK(type IN ('info','warning','success','urgent')),
      is_pinned INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      image_url TEXT,
      scheduled_for TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS flash_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'normal',
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS player_leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      tournament_id INTEGER,
      department_id INTEGER,
      season TEXT,
      matches INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      total_kills INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS point_distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hall_of_fame (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game TEXT NOT NULL,
      reason TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('team','player')),
      team_id INTEGER,
      player_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS certificate_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      description_template TEXT NOT NULL,
      signature_name TEXT,
      signature_designation TEXT,
      signature_name_2 TEXT,
      signature_designation_2 TEXT,
      signature_image TEXT,
      signature_image_2 TEXT,
      colors TEXT,
      typography TEXT,
      logo_url TEXT,
      logo_size INTEGER DEFAULT 80,
      logo_position TEXT DEFAULT 'top',
      seal_url TEXT,
      watermark_text TEXT,
      border_design TEXT,
      sponsor_logos TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leaderboard_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season TEXT NOT NULL,
      team_id INTEGER,
      team_name TEXT NOT NULL,
      team_code TEXT NOT NULL,
      department_code TEXT NOT NULL,
      matches_played INTEGER,
      wins INTEGER,
      total_kills INTEGER,
      total_points INTEGER,
      final_rank INTEGER,
      archived_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS championship_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season TEXT UNIQUE NOT NULL,
      champion_team_name TEXT NOT NULL,
      champion_dept_code TEXT NOT NULL,
      runner_up_name TEXT NOT NULL,
      mvp_player_name TEXT NOT NULL,
      mvp_player_kills INTEGER,
      total_teams INTEGER,
      total_matches INTEGER,
      archived_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS homepage_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS sponsors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo_url TEXT NOT NULL,
      link TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo_url TEXT NOT NULL,
      type TEXT DEFAULT 'partner',
      link TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);

  // Seed default homepage settings if empty
  const hsCount = db.get('SELECT COUNT(*) as count FROM homepage_settings').count;
  if (hsCount === 0) {
    const defaultSettings = [
      { key: 'hero_title', value: 'BHIMA ESPORTS' },
      { key: 'hero_subtitle', value: 'Where Legends Are Forged' },
      { key: 'hero_video_url', value: '' },
      { key: 'hero_banner_url', value: '' },
      { key: 'primary_button_text', value: 'Register Now' },
      { key: 'primary_button_link', value: '/register' },
      { key: 'secondary_button_text', value: 'View Leaderboard' },
      { key: 'secondary_button_link', value: '/leaderboard' },
      { key: 'flash_news_enabled', value: '1' },
      { key: 'flash_news_speed', value: 'normal' }
    ];
    for (const s of defaultSettings) {
      db.run('INSERT INTO homepage_settings (key, value) VALUES (?, ?)', [s.key, s.value]);
    }
  }

  // Seed default CMS settings if empty
  const cmsCount = db.get("SELECT COUNT(*) as count FROM settings WHERE key LIKE 'cms_%'").count;
  if (cmsCount === 0) {
    const defaultCMSSettings = [
      // Hero
      { key: 'cms_hero_label', value: 'OFFICIAL ESPORTS PLATFORM' },
      { key: 'cms_hero_title_1', value: 'BHIMA' },
      { key: 'cms_hero_title_2', value: 'ESPORTS' },
      { key: 'cms_hero_title_3', value: 'TOURNAMENT HUB' },
      { key: 'cms_hero_description', value: 'The ultimate battlefield for legends. Join tournaments, climb the leaderboards, and prove your skills.' },
      { key: 'cms_hero_btn_primary', value: 'Register Now' },
      { key: 'cms_hero_btn_secondary', value: 'View Leaderboard' },
      { key: 'cms_hero_bg_opacity', value: '0.85' },
      { key: 'cms_hero_alignment', value: 'center' },
      { key: 'cms_hero_visible', value: '1' },

      // Navigation
      { key: 'cms_nav_home', value: 'Home' },
      { key: 'cms_nav_tournaments', value: 'Tournaments' },
      { key: 'cms_nav_teams', value: 'Teams' },
      { key: 'cms_nav_players', value: 'Players' },
      { key: 'cms_nav_leaderboard', value: 'Leaderboard' },
      { key: 'cms_nav_hof', value: 'Hall of Fame' },

      // Homepage Cards
      { key: 'cms_home_card1_title', value: 'BHIMA Esports Season 1' },
      { key: 'cms_home_card1_sub', value: 'Registrations are now open!' },
      { key: 'cms_home_card2_title', value: 'Tournament Hub' },
      { key: 'cms_home_card2_sub', value: 'Explore ongoing battles' },
      { key: 'cms_home_card3_title', value: 'Leaderboards Live' },
      { key: 'cms_home_card3_sub', value: 'Check current player standings' },
      { key: 'cms_home_card4_title', value: 'Join the Community' },
      { key: 'cms_home_card4_sub', value: 'New challengers arriving' },

      // Pages
      { key: 'cms_page_tournaments_title', value: 'Active Tournaments' },
      { key: 'cms_page_tournaments_sub', value: 'Register your squad for upcoming battles' },
      { key: 'cms_page_teams_title', value: 'Esports Teams' },
      { key: 'cms_page_teams_sub', value: 'Official rosters and team statistics' },
      { key: 'cms_page_players_title', value: 'Player Directory' },
      { key: 'cms_page_players_sub', value: 'Search and analyze player statistics' },
      { key: 'cms_page_leaderboard_title', value: 'Global Leaderboard' },
      { key: 'cms_page_leaderboard_sub', value: 'Real-time standings and rankings' },
      { key: 'cms_page_hof_title', value: 'Hall of Fame' },
      { key: 'cms_page_hof_sub', value: 'Legends immortalized in Bhima Esports history' },
      { key: 'cms_page_about_title', value: 'About Bhima Esports' },
      { key: 'cms_page_about_sub', value: 'The ultimate competitive gaming platform' },
      { key: 'cms_page_contact_title', value: 'Contact Us' },
      { key: 'cms_page_contact_sub', value: 'Get in touch with the admin team' },

      // Footer
      { key: 'cms_footer_logo_text', value: 'BHIMA ESPORTS' },
      { key: 'cms_footer_description', value: 'The official esports tournament platform for competitive gaming.' },
      { key: 'cms_footer_copyright', value: '© 2026 Bhima Esports. All rights reserved.' },
      { key: 'cms_footer_email', value: 'contact@bhimaesports.com' },
      { key: 'cms_footer_phone', value: '+1 (555) 123-4567' },

      // SEO
      { key: 'cms_seo_title', value: 'Bhima Esports - Tournament Platform' },
      { key: 'cms_seo_description', value: 'Official esports tournament platform for Bhima Esports. Join tournaments, track stats, and climb the leaderboard.' },
      { key: 'cms_seo_keywords', value: 'esports, tournaments, gaming, leaderboard, bgmi, free fire, codm' }
    ];
    for (const s of defaultCMSSettings) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [s.key, s.value]);
    }
  }
}

// ─── Initialize ──────────────────────────────────────────────────────────────

export async function initializeDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new Database(new SQL.Database(fileBuffer));
    console.log('✅ Loaded existing database from', DB_PATH);
  } else {
    db = new Database(new SQL.Database());
    console.log('✅ Created new database');
  }

  // Enable WAL-like pragma and foreign keys
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = DELETE');

  createTables(db);

  // Add migration check to add mode to tournaments table
  try {
    db.run("ALTER TABLE tournaments ADD COLUMN mode TEXT DEFAULT 'br' CHECK(mode IN ('br','cs'))");
  } catch (e) {
    // Column already exists
  }

  // Migration check to add columns to certificates table
  const newCols = [
    { name: 'status', type: "TEXT DEFAULT 'active'" },
    { name: 'revocation_reason', type: "TEXT" },
    { name: 'reissued_from', type: "TEXT" },
    { name: 'template_id', type: "INTEGER" },
    { name: 'title', type: "TEXT" },
    { name: 'description_text', type: "TEXT" },
    { name: 'signature_name', type: "TEXT" },
    { name: 'signature_designation', type: "TEXT" },
    { name: 'signature_image', type: "TEXT" },
    { name: 'signature_name_2', type: "TEXT" },
    { name: 'signature_designation_2', type: "TEXT" },
    { name: 'signature_image_2', type: "TEXT" },
    { name: 'colors', type: "TEXT" },
    { name: 'typography', type: "TEXT" },
    { name: 'logo_url', type: "TEXT" },
    { name: 'logo_size', type: "INTEGER DEFAULT 80" },
    { name: 'logo_position', type: "TEXT DEFAULT 'top'" },
    { name: 'seal_url', type: "TEXT" },
    { name: 'watermark_text', type: "TEXT" },
    { name: 'border_design', type: "TEXT" },
    { name: 'qr_code_enabled', type: "INTEGER DEFAULT 1" },
    { name: 'sponsor_logos', type: "TEXT" },
    { name: 'position', type: "TEXT" },
    { name: 'award_type', type: "TEXT" },
    { name: 'player_id', type: "INTEGER" },
    { name: 'achievement_badge', type: "TEXT" },
    { name: 'achievement_level', type: "TEXT" }
  ];

  for (const col of newCols) {
    try {
      db.run(`ALTER TABLE certificates ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      // Column already exists
    }
  }

  // Migration for team_leaderboard is_qualified
  try {
    db.run("ALTER TABLE team_leaderboard ADD COLUMN is_qualified INTEGER DEFAULT 0");
  } catch (e) {
    // Column already exists
  }

  // Backfill missing teams into leaderboard
  try {
    db.run("INSERT OR IGNORE INTO team_leaderboard (team_id) SELECT id FROM teams WHERE status = 'active'");
  } catch (e) {
    // Ignore
  }

    const playerCols = [
      'total_damage INTEGER DEFAULT 0',
      'headshot_percentage REAL DEFAULT 0',
      'average_survival_time REAL DEFAULT 0',
      'total_points INTEGER DEFAULT 0',
      'booyahs INTEGER DEFAULT 0',
      'player_login_id TEXT',
      'password_hash TEXT',
      'approval_status TEXT DEFAULT "pending" CHECK(approval_status IN ("pending", "approved", "rejected"))',
      'real_name TEXT',
      'role TEXT',
      'country TEXT',
      'photo_url TEXT',
      'jersey_url TEXT',
      'banner_url TEXT'
    ];

    for (const col of playerCols) {
      try {
        db.run(`ALTER TABLE players ADD COLUMN ${col}`);
        console.log(`✅ Added column ${col.split(' ')[0]} to players`);
      } catch (e) {
        // Ignored
      }
    }

    const deptCols = [
      'logo_url TEXT',
      'banner_url TEXT',
      'color TEXT',
      'description TEXT'
    ];
    for (const col of deptCols) {
      try {
        db.run(`ALTER TABLE departments ADD COLUMN ${col}`);
        console.log(`✅ Added column ${col.split(' ')[0]} to departments`);
      } catch (e) {}
    }

  // New Teams columns
  try { db.run(`ALTER TABLE teams ADD COLUMN banner_url TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE teams ADD COLUMN coach_name TEXT`); } catch(e) {}

  // New Players columns
  try { db.run(`ALTER TABLE players ADD COLUMN real_name TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE players ADD COLUMN role TEXT`); } catch(e) {}

  // New Tournaments columns
  try { db.run(`ALTER TABLE tournaments ADD COLUMN banner_url TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE tournaments ADD COLUMN cover_image TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE tournaments ADD COLUMN prize_pool TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE tournaments ADD COLUMN maps TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE tournaments ADD COLUMN match_format TEXT`); } catch(e) {}

  // New Matches columns
  try { db.run(`ALTER TABLE matches ADD COLUMN time TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN venue TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN description TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN thumbnail_url TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN poster_url TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN match_name TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN game TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN winning_team_id INTEGER`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN runner_up_team_id INTEGER`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN mvp_player_id INTEGER`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN notes TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN highlights_url TEXT`); } catch(e) {}
  try { db.run(`ALTER TABLE matches ADD COLUMN published INTEGER DEFAULT 1`); } catch(e) {}
  db.saveToFile();
  console.log('✅ Migrated database: added advanced columns to certificates, players, teams & matches tables');
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function restoreDatabase(backupPath) {
  const SQL = await initSqlJs();
  if (fs.existsSync(backupPath)) {
    const fileBuffer = fs.readFileSync(backupPath);
    db = new Database(new SQL.Database(fileBuffer));
    // Save the restored instance to the active sqlite file on disk
    db.saveToFile();
    console.log('✅ Database successfully restored from', backupPath);
    return true;
  }
  throw new Error('Backup file does not exist.');
}

// Ensure database is saved on process exit or nodemon restart
function handleExit() {
  if (db) {
    db.saveToFile();
    console.log('💾 Database forcefully saved on exit.');
  }
}
process.on('exit', handleExit);
process.on('SIGINT', () => { handleExit(); process.exit(0); });
process.on('SIGTERM', () => { handleExit(); process.exit(0); });
process.on('SIGUSR1', () => { handleExit(); process.exit(0); });
process.on('SIGUSR2', () => { handleExit(); process.exit(0); }); // Nodemon restart signal

export default { initializeDatabase, getDb, restoreDatabase };

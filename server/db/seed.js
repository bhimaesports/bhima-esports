import bcrypt from 'bcryptjs';
import { getDb } from './schema.js';

const DEFAULT_DEPARTMENTS = [
  { name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
  { name: 'Biomedical Engineering', code: 'BME' },
  { name: 'Computer Science & Engineering', code: 'CSE' },
  { name: 'Civil Engineering', code: 'CIVIL' },
  { name: 'Electronics & Communication Engineering', code: 'ECE' },
  { name: 'Electrical & Electronics Engineering', code: 'EEE' },
  { name: 'Mechanical Engineering', code: 'MECH' },
  { name: 'Mining Engineering', code: 'MIN' },
];

const DEFAULT_SETTINGS = [
  { key: 'website_name', value: 'BHIMA ESPORTS' },
  { key: 'primary_color', value: '#D7FF00' },
  { key: 'secondary_color', value: '#1a1a2e' },
  { key: 'background_color', value: '#0f0f23' },
  { key: 'accent_color', value: '#16213e' },
  { key: 'game_title', value: 'FreeFire, Bgmi, Cod' },
  { key: 'college_name', value: 'UCEOU, Bhima Hostel' },
  { key: 'contact_email', value: 'bhimaesports@gmail.com' },
  { key: 'instagram_url', value: '' },
  { key: 'discord_url', value: '' },
  { key: 'maintenance_mode', value: 'false' },
  { key: 'registration_enabled', value: 'true' },
];

// Standard Free Fire placement points
const DEFAULT_POINT_DISTRIBUTION = {
  title: 'Free Fire Standard Points',
  data: JSON.stringify({
    kill_point_value: 1,
    placements: [
      { rank: 1, points: 12 },
      { rank: 2, points: 9 },
      { rank: 3, points: 8 },
      { rank: 4, points: 7 },
      { rank: 5, points: 6 },
      { rank: 6, points: 5 },
      { rank: 7, points: 4 },
      { rank: 8, points: 3 },
      { rank: 9, points: 2 },
      { rank: 10, points: 1 },
      { rank: 11, points: 0 },
      { rank: 12, points: 0 },
    ],
  }),
};

export async function seedDatabase() {
  const db = getDb();

  // Seed departments
  const existingDepts = db.get('SELECT COUNT(*) as count FROM departments');
  if (existingDepts.count === 0) {
    for (const dept of DEFAULT_DEPARTMENTS) {
      db.run('INSERT INTO departments (name, code) VALUES (?, ?)', [dept.name, dept.code]);
    }
    console.log('✅ Seeded 8 departments');
  }

  // Seed default admin
  const existingAdmin = db.get('SELECT COUNT(*) as count FROM admins');
  if (existingAdmin.count === 0) {
    const passwordHash = bcrypt.hashSync('Bhima@2026', 10);
    db.run('INSERT INTO admins (admin_id, password_hash) VALUES (?, ?)', [
      'bhimaadmin',
      passwordHash,
    ]);
    console.log('✅ Seeded default admin (bhimaadmin / Bhima@2026)');
  }

  // Seed settings
  const existingSettings = db.get('SELECT COUNT(*) as count FROM settings');
  if (existingSettings.count === 0) {
    for (const s of DEFAULT_SETTINGS) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [s.key, s.value]);
    }
    console.log('✅ Seeded default settings');
  }

  // Seed point distribution
  const existingPoints = db.get('SELECT COUNT(*) as count FROM point_distributions');
  if (existingPoints.count === 0) {
    db.run('INSERT INTO point_distributions (title, data) VALUES (?, ?)', [
      DEFAULT_POINT_DISTRIBUTION.title,
      DEFAULT_POINT_DISTRIBUTION.data,
    ]);
    console.log('✅ Seeded default point distribution');
  }

  // Seed default certificate templates
  const existingTemplates = db.get('SELECT COUNT(*) as count FROM certificate_templates');
  if (existingTemplates.count === 0) {
    const defaultTemplates = [
      {
        name: 'Participation Certificate',
        title: 'Certificate of Participation',
        description_template: 'For outstanding play and sportsmanship in the {tournament_name} tournament representing team {team_name} from the Department of {department}.',
        signature_name: 'Bhima Esports Convener',
        signature_designation: 'Convener',
        signature_name_2: 'Bhima Hostel Warden',
        signature_designation_2: 'Warden',
        colors: JSON.stringify({ accent: '#D7FF00', text: '#ffffff', bg_start: '#0f0f23', bg_end: '#16213e', border: '#D7FF00' }),
        typography: JSON.stringify({ title_font: 'Orbitron', body_font: 'Rajdhani' }),
        logo_url: '/assets/logo.png',
        logo_size: 80,
        logo_position: 'top',
        seal_url: '',
        watermark_text: 'BHIMA ESPORTS',
        border_design: 'solid',
        is_default: 1
      },
      {
        name: 'Winner Certificate',
        title: 'Certificate of Achievement',
        description_template: 'For securing {position} in the {tournament_name} tournament, exhibiting exceptional skill and dedication representing team {team_name} from the Department of {department}.',
        signature_name: 'Bhima Esports Convener',
        signature_designation: 'Convener',
        signature_name_2: 'Bhima Hostel Warden',
        signature_designation_2: 'Warden',
        colors: JSON.stringify({ accent: '#FFD700', text: '#ffffff', bg_start: '#0f0f23', bg_end: '#1a1a2e', border: '#FFD700' }),
        typography: JSON.stringify({ title_font: 'Orbitron', body_font: 'Rajdhani' }),
        logo_url: '/assets/logo.png',
        logo_size: 80,
        logo_position: 'top',
        seal_url: '',
        watermark_text: 'CHAMPION',
        border_design: 'solid',
        is_default: 0
      },
      {
        name: 'MVP Certificate',
        title: 'Most Valuable Player Award',
        description_template: 'For outstanding individual performance and achieving the Most Valuable Player (MVP) award in the {tournament_name} tournament representing team {team_name} from the Department of {department}.',
        signature_name: 'Bhima Esports Convener',
        signature_designation: 'Convener',
        signature_name_2: 'Bhima Hostel Warden',
        signature_designation_2: 'Warden',
        colors: JSON.stringify({ accent: '#FF6B35', text: '#ffffff', bg_start: '#0f0f23', bg_end: '#111111', border: '#FF6B35' }),
        typography: JSON.stringify({ title_font: 'Orbitron', body_font: 'Rajdhani' }),
        logo_url: '/assets/logo.png',
        logo_size: 80,
        logo_position: 'top',
        seal_url: '',
        watermark_text: 'MVP',
        border_design: 'solid',
        is_default: 0
      }
    ];

    for (const t of defaultTemplates) {
      db.run(`
        INSERT INTO certificate_templates (
          name, title, description_template, signature_name, signature_designation,
          signature_name_2, signature_designation_2, colors, typography, logo_url,
          logo_size, logo_position, seal_url, watermark_text, border_design, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        t.name, t.title, t.description_template, t.signature_name, t.signature_designation,
        t.signature_name_2, t.signature_designation_2, t.colors, t.typography, t.logo_url,
        t.logo_size, t.logo_position, t.seal_url, t.watermark_text, t.border_design, t.is_default
      ]);
    }
    console.log('✅ Seeded default certificate templates');
  }

  // Initialize dept_leaderboard entries for each department
  const existingDeptLb = db.get('SELECT COUNT(*) as count FROM dept_leaderboard');
  if (existingDeptLb.count === 0) {
    const depts = db.all('SELECT id FROM departments');
    for (const dept of depts) {
      db.run('INSERT INTO dept_leaderboard (department_id) VALUES (?)', [dept.id]);
    }
    console.log('✅ Initialized department leaderboard');
  }

  db.saveToFile();
}

export default seedDatabase;

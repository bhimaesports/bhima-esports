import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'server', 'db', 'bhima_esports.sqlite');

async function dropTable() {
  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(filebuffer);
  
  db.run("DROP TABLE IF EXISTS flash_news");
  
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  
  console.log("Table flash_news dropped successfully.");
}

dropTable().catch(console.error);

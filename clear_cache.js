import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./server/database.sqlite');
db.run("DELETE FROM settings WHERE key='homepage_config'", (err) => {
  if (err) console.error(err);
  else console.log('Done');
});

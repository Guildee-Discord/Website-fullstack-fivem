const mysql = require("mysql2/promise");

let pool;

async function initDb(config) {
  pool = mysql.createPool(config.mysqlUrl);

  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function getDb() {
  if (!pool) throw new Error("DB non initialisée");
  return pool;
}

module.exports = { initDb, getDb };
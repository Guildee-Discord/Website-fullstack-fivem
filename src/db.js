const mysql = require("mysql2/promise");
const configuration = require('../configuration/config')

let pool;

async function initDb(config) {
  pool = mysql.createPool(configuration.database.mysqlUrl);

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
  if (!pool) throw new Error("Database not initialized");
  return pool;
}

module.exports = { initDb, getDb };
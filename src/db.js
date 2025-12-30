const mysql = require("mysql2/promise");

let pool;

function initDb(config) {
  // Technique "URL string" : mysql://user:pass@host:port/db
  pool = mysql.createPool(config.mysqlUrl);

  // Test léger au démarrage (sans faire planter si la DB répond lentement)
  pool.getConnection()
    .then(conn => conn.ping().finally(() => conn.release()))
    .then(() => console.log("✅ MySQL connecté"))
    .catch(err => console.error("⚠️ MySQL non joignable au démarrage:", err.message));
}

function getDb() {
  if (!pool) throw new Error("DB non initialisée (initDb manquant)");
  return pool;
}

module.exports = { initDb, getDb };

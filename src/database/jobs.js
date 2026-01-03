const { getDb } = require("../db");

async function getAllJobs() {
  const db = getDb();
  const [rows] = await db.query(`
    SELECT name, label, whitelisted
    FROM jobs
    ORDER BY label ASC
  `);
  return rows;
}

module.exports = { getAllJobs };
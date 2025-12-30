const { getDb } = require("../db");

async function upsertUserByDiscordProfile(profile) {
  const db = getDb();
  const discordId = profile.id;
  const username = profile.username || profile.global_name || "unknown";
  const avatar = profile.avatar || null;

  // Upsert
  const [result] = await db.execute(
    `INSERT INTO users (discord_id, username, avatar)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       username = VALUES(username),
       avatar = VALUES(avatar)`,
    [discordId, username, avatar]
  );

  // Récupère l'entrée
  const [rows] = await db.execute(
    "SELECT id, discord_id, username, avatar, created_at, updated_at FROM users WHERE discord_id = ? LIMIT 1",
    [discordId]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const db = getDb();
  const [rows] = await db.execute(
    "SELECT id, discord_id, username, avatar, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

module.exports = { upsertUserByDiscordProfile, findUserById };

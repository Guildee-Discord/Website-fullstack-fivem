const { getDb } = require("../db");

function toPublicUser(row) {
  if (!row) return null;
  return {
    discord_id: row.discord_id,
    username: row.discord_username,
    avatar: row.discord_avatar,
    linked: true,
  };
}

async function upsertDiscordProfile(discordProfile) {
  const db = getDb();

  const discordId = String(discordProfile.id);
  const username =
    discordProfile.username ||
    discordProfile.global_name ||
    (discordProfile.user && (discordProfile.user.username || discordProfile.user.global_name)) ||
    "unknown";

  const avatar =
    discordProfile.avatar ||
    (discordProfile.user && discordProfile.user.avatar) ||
    null;

  // On vérifie si ce discord_id est déjà lié à un joueur (dans users)
  const [rows] = await db.execute(
    `SELECT discord_id, discord_username, discord_avatar
     FROM users
     WHERE discord_id = ?
     LIMIT 1`,
    [discordId]
  );

  if (rows.length) {
    // Optionnel: garder username/avatar à jour
    await db.execute(
      `UPDATE users
       SET discord_username = ?, discord_avatar = ?
       WHERE discord_id = ?
       LIMIT 1`,
      [username, avatar, discordId]
    );

    return {
      discord_id: discordId,
      username,
      avatar,
      linked: true,
    };
  }

  // Pas lié → on renvoie le profil discord (sans écrire en DB)
  return {
    discord_id: discordId,
    username,
    avatar,
    linked: false,
  };
}

async function linkDiscordToIdentifier(discordId, identifier, username, avatar) {
  const db = getDb();

  const dId = String(discordId);
  const ident = String(identifier);
  const uname = String(username);
  const av = avatar ?? null;

  // Vérifie que l'identifier existe
  const [exists] = await db.execute(
    `SELECT 1 FROM users WHERE identifier = ? LIMIT 1`,
    [ident]
  );
  if (!exists.length) {
    return { ok: false, error: "identifier_not_found" };
  }

  // Empêche de lier un discord déjà lié à quelqu'un d'autre
  const [already] = await db.execute(
    `SELECT 1 FROM users WHERE discord_id = ? LIMIT 1`,
    [dId]
  );
  if (already.length) {
    return { ok: false, error: "discord_already_linked" };
  }

  // Link
  await db.execute(
    `UPDATE users
     SET discord_id = ?, discord_username = ?, discord_avatar = ?
     WHERE identifier = ?
     LIMIT 1`,
    [dId, uname, av, ident]
  );

  return {
    ok: true,
    user: {
      discord_id: dId,
      username: uname,
      avatar: av,
      linked: true,
    },
  };
}

async function findLinkedUserByDiscordId(discordId) {
  const db = getDb();

  const [rows] = await db.execute(
    `SELECT discord_id, discord_username, discord_avatar
     FROM users
     WHERE discord_id = ?
     LIMIT 1`,
    [String(discordId)]
  );

  return toPublicUser(rows[0]);
}

module.exports = {
  upsertDiscordProfile,
  linkDiscordToIdentifier,
  findLinkedUserByDiscordId,
};
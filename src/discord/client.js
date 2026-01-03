const { Client, GatewayIntentBits, ActivityType, Events } = require("discord.js");
const configuration = require("../../configuration/config");
let client = null;

function toActivityType(type) {
  const t = String(type || "").toUpperCase();
  if (t === "LISTENING") return ActivityType.Listening;
  if (t === "WATCHING") return ActivityType.Watching;
  if (t === "COMPETING") return ActivityType.Competing;
  return ActivityType.Playing;
}

async function initDiscordClient(config) {
  const botCfg = configuration.bot || {};
  const enabled = botCfg.enabled !== false;

  if (!enabled) return { ok: true, enabled: false };

  if (!botCfg.token) {
    return { ok: false, enabled: true, error: "Token manquant (bot.json)" };
  }

  client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, () => {
    try {
      const activity = botCfg.activity || {};
      client.user.setPresence({
        status: botCfg.status || "online",
        activities: [{
          name: activity.name || "Website FiveM",
          type: toActivityType(activity.type)
        }]
      });
    } catch (_) {}
  });

  try {
    await client.login(botCfg.token);
    return { ok: true, enabled: true };
  } catch (e) {
    return { ok: false, enabled: true, error: e.message };
  }
}

function getDiscordClient() {
  if (!client) throw new Error("Discord client non initialisé");
  return client;
}

module.exports = { initDiscordClient, getDiscordClient };
const express = require("express");
const configuration = require("../../../configuration/config");
const { getDiscordClient } = require("../../../src/discord/client");
const { getAllJobs } = require("../../database/jobs");
const jobsEmojis = require("../../../configuration/emoji.json");

function normStr(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pickEmoji(job) {
  const name = normStr(job?.name);
  const label = normStr(job?.label);
  const text = `${name} ${label}`.trim();

  if (jobsEmojis && job?.name && jobsEmojis[job.name]) return jobsEmojis[job.name];

  const rules = [
    // --- Forces de l'ordre ---
    { keys: ["police", "lspd", "sheriff", "state", "highway", "trooper", "fbi", "swat"], emoji: "👮" },
    { keys: ["gang", "mafia", "cartel"], emoji: "🕴️" },

    // --- Médical / secours ---
    { keys: ["ambulance", "ems", "medic", "paramedic"], emoji: "🚑" },
    { keys: ["doctor", "medecin"], emoji: "🩻" },
    { keys: ["nurse", "infirm"], emoji: "💉" },
    { keys: ["fire", "firefighter", "pompi"], emoji: "🚒" },

    // --- Transport / logistique ---
    { keys: ["taxi", "uber", "cab"], emoji: "🚕" },
    { keys: ["bus"], emoji: "🚌" },
    { keys: ["trucker", "truck", "routier"], emoji: "🚚" },
    { keys: ["delivery", "livreur", "poste", "postal", "gopostal", "dhl", "ups", "fedex"], emoji: "📦" },
    { keys: ["garbage", "trash", "dechet", "eboueur"], emoji: "🚮" },
    { keys: ["dock", "port", "harbor"], emoji: "⚓" },

    // --- Aérien ---
    { keys: ["airport", "air", "pilot"], emoji: "✈️" },
    { keys: ["heli", "helipilot"], emoji: "🚁" },

    // --- Mécanique / véhicules ---
    { keys: ["mechanic", "mecano", "bennys", "tuning", "tow", "depanne"], emoji: "🔧" },
    { keys: ["cardealer", "dealer", "concess"], emoji: "🚗" },

    // --- BTP / métiers manuels ---
    { keys: ["construction", "btp", "builder", "chantier"], emoji: "🏗️" },
    { keys: ["electric", "electrician", "elec"], emoji: "💡" },
    { keys: ["plumb", "plumber", "plomb"], emoji: "🚰" },
    { keys: ["clean", "cleaner", "menage"], emoji: "🧹" },

    // --- Récolte / nature ---
    { keys: ["farmer", "fermier", "farm", "agri"], emoji: "🌾" },
    { keys: ["vigneron", "wine", "vine"], emoji: "🍇" },
    { keys: ["fisher", "fisherman", "peche"], emoji: "🎣" },
    { keys: ["miner", "mining", "mine"], emoji: "⛏️" },
    { keys: ["lumber", "lumberjack", "bois"], emoji: "🌲" },

    // --- Food / bars ---
    { keys: ["restaurant", "resto", "cook", "chef"], emoji: "🍽️" },
    { keys: ["burger", "burgershot"], emoji: "🍔" },
    { keys: ["pizza", "pizzathis"], emoji: "🍕" },
    { keys: ["bar", "bartender", "barman"], emoji: "🍸" },
    { keys: ["nightclub", "club", "unicorn", "bahamas"], emoji: "🎧" },

    // --- Business / legal / media ---
    { keys: ["bank", "banker"], emoji: "🏦" },
    { keys: ["law", "lawyer", "avocat"], emoji: "⚖️" },
    { keys: ["judge", "tribunal"], emoji: "🏛️" },
    { keys: ["realestate", "immo"], emoji: "🏠" },
    { keys: ["reporter", "journalist", "weazel", "news"], emoji: "🎤" },

    // --- Sécurité ---
    { keys: ["security", "guard", "bodyguard"], emoji: "🛡️" },

    // --- “Illégal” générique (si tu utilises ce genre d’IDs) ---
    { keys: ["illegal", "drug", "dealer", "smugg", "thief", "hacker"], emoji: "🖤" },

    // --- chômage / default ---
    { keys: ["unemployed", "none", "jobless"], emoji: "🧍" }
  ];

  for (const rule of rules) {
    if (rule.keys.some((k) => text.includes(k))) return rule.emoji;
  }

  return "💼";
}

async function getOnlinePlayersCount() {
  let baseUrl = configuration.module_config.fivem.baseUrl;
  if (!baseUrl) return null;

  baseUrl = baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/players.json`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const players = JSON.parse(text);
    return Array.isArray(players) ? players.length : null;
  } catch (e) {
    return null;
  }
}

module.exports = (ctx) => {
  const router = express.Router();

  router.get("/jobs", async (req, res) => {
    const config_global = configuration;
    const name = (config_global.app.name || "G").trim();
    const parts = name.split(/\s+/);
    const global_initial_name = parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
    const onlineCount = await getOnlinePlayersCount();

    let discordUser = null;
    if (req.user?.discord_id) {
      try {
        const discordClient = getDiscordClient();
        discordUser = await discordClient.users.fetch(req.user.discord_id, { force: true });
      } catch (e) {
        const errorMessages = [{ type: "error", text: res.locals.t("linked.var12") }];
        return res.status(404).render("404", {
          errorMessages,
          showDocsButton: false,
          showHomeButton: true
        });
      }
    }

    let jobs = [];
    try {
      jobs = await getAllJobs();
    } catch (e) {
      console.error("Erreur chargement jobs :", e);
    }

    const jobsWithEmojis = (jobs || []).map((job) => ({
      ...job,
      whitelisted: Number(job.whitelisted) === 1,
      emoji: pickEmoji(job)
    }));

    return res.render("jobs", {
      jobs: jobsWithEmojis,
      config_global: config_global,
      global_initial_name: global_initial_name,
      user: discordUser,
      req: req,
      toast: null,
      onlineCount: onlineCount ?? 0,
      status_server: onlineCount === null || onlineCount === undefined,
    });
  });

  return router;
};
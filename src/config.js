const fs = require("fs");
const path = require("path");
const { printBox } = require("../src/function/printBox");
const config_botdiscord = require("../configuration/bot.json");

function fatal(title, lines) {
  const red = "\x1b[31m";
  const reset = "\x1b[0m";

  printBox(
    [
      `${red}${title}${reset}`,
      ...lines,
    ],
    red
  );
  process.exit(1);
}

function loadConfig() {
  const configPath = path.join(__dirname, "..", "configuration", "config.json");

  // 1) Fichier manquant
  if (!fs.existsSync(configPath)) {
    fatal("Configuration manquante", [
      `Le fichier \x1b[33mconfiguration/config.json\x1b[0m est introuvable.`,
      "",
      "Étapes à suivre :",
      `1. Copie \x1b[36mconfiguration/config.json.example\x1b[0m`,
      `   retire le \x1b[35m.example\x1b[0m`,
      "2. Ouvre-le et complète les informations requises.",
    ]);
  }

  // 2) Lecture / JSON invalide
  let cfg;
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    cfg = JSON.parse(raw);
  } catch (e) {
    fatal("Configuration invalide", [
      `Impossible de lire / parser \x1b[33mconfiguration/config.json\x1b[0m.`,
      "",
      `Détail : \x1b[31m${e.message}\x1b[0m`,
      "",
      "Astuce : vérifie les virgules, guillemets et accolades.",
    ]);
  }

  // Defaults
  cfg.port = cfg.port ?? 3000;
  cfg.baseUrl = cfg.baseUrl ?? `http://localhost:${cfg.port}`;
  config_botdiscord.discord = config_botdiscord.discord ?? {};
  cfg.website = cfg.website ?? {};
  config_botdiscord.discord.scope = config_botdiscord.discord.scope ?? ["identify"];

  // 3) Validation des champs requis (collecte toutes les erreurs)
  const missing = [];

  if (!cfg.sessionSecret) missing.push("- sessionSecret manquant");
  if (!cfg.mysqlUrl) missing.push("- mysqlUrl manquant");

  if (!config_botdiscord.discord.clientID) missing.push("- discord.clientID manquant");
  if (!config_botdiscord.discord.clientSecret) missing.push("- discord.clientSecret manquant");
  if (!config_botdiscord.discord.callbackURL) missing.push("- discord.callbackURL manquant");

  // (optionnel) baseUrl/callbackURL cohérence
  // si tu veux être strict, tu peux vérifier que callbackURL commence par baseUrl
  // mais je laisse soft pour éviter de bloquer en dev.

  if (missing.length) {
    fatal("Configuration incomplète", [
      `Le fichier \x1b[33mconfiguration/config.json\x1b[0m est présent mais incomplet.`,
      "",
      "Champs manquants :",
      ...missing,
      "",
      "Corrige le fichier puis relance le serveur.",
    ]);
  }

  return cfg;
}

module.exports = { loadConfig };
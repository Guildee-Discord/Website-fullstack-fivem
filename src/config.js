const fs = require("fs");
const path = require("path");
const { printBox } = require("../src/function/printBox");
const config_botdiscord = require("../configuration/bot.json");
const configuration = require("../configuration/config.js");

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
  const configPath = path.join(__dirname, "..", "configuration", "config.js");

  // 1) Missing file
  if (!fs.existsSync(configPath)) {
    fatal("Missing configuration", [
      `The file \x1b[33mconfiguration/config.js\x1b[0m cannot be found.`,
      "",
      "Steps to follow:",
      `1. Copy \x1b[36mconfiguration/config.js.example\x1b[0m`,
      "2. Open it and fill in the required information.",
    ]);
  }

  // 2) Load module (invalid JS / runtime error)
  let cfg;
  try {
    delete require.cache[require.resolve(configPath)];
    cfg = require(configPath);
  } catch (e) {
    fatal("Invalid configuration", [
      `Unable to load \x1b[33mconfiguration/config.js\x1b[0m.`,
      "",
      `Details: \x1b[31m${e.message}\x1b[0m`,
      "",
      "Tip: check the JS syntax and exports.",
    ]);
  }

  // Defaults
  cfg.port = cfg.port ?? 3000;
  cfg.baseUrl = cfg.baseUrl ?? `http://localhost:${cfg.port}`;
  config_botdiscord.discord = config_botdiscord.discord ?? {};
  cfg.website = cfg.website ?? {};
  config_botdiscord.discord.scope = config_botdiscord.discord.scope ?? ["identify"];
  cfg.configuration = configuration ?? {};

  const missing = [];
  if (!configuration.app?.sessionSecret) missing.push("- missing sessionSecret");
  if (!configuration.database?.mysqlUrl) missing.push("- missing mysqlUrl");
  if (!configuration.bot?.clientID) missing.push("- missing discord.clientID");
  if (!configuration.bot?.clientSecret) missing.push("- missing discord.clientSecret");
  if (!configuration.bot?.callbackURL) missing.push("- missing discord.callbackURL");
  if (missing.length) {
    fatal("Incomplete configuration", [
      `The file \x1b[33mconfiguration/config.js\x1b[0m exists but is incomplete.`,
      "",
      "Missing fields:",
      ...missing,
      "",
      "Fix the file and restart the server.",
    ]);
  }

  return cfg;
}

module.exports = { loadConfig };
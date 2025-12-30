const fs = require("fs");
const path = require("path");

function loadConfig() {
  const configPath = path.join(__dirname, "..", "config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(
      "config.json introuvable. Copie config.json.example -> config.json et remplis-le."
    );
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const cfg = JSON.parse(raw);

  // Defaults utiles
  cfg.port = cfg.port ?? 3000;
  cfg.baseUrl = cfg.baseUrl ?? `http://localhost:${cfg.port}`;
  if (!cfg.sessionSecret) throw new Error("sessionSecret manquant dans config.json");
  if (!cfg.mysqlUrl) throw new Error("mysqlUrl manquant dans config.json");
  if (!cfg.discord?.clientID || !cfg.discord?.clientSecret || !cfg.discord?.callbackURL) {
    throw new Error("discord.clientID / clientSecret / callbackURL manquants dans config.json");
  }
  cfg.discord.scope = cfg.discord.scope ?? ["identify"];
  return cfg;
}

module.exports = { loadConfig };

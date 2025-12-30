const pkg = require("./package.json");

const { printBox } = require("./src/function/printBox");
const { loadConfig } = require("./src/config");
const { initDb } = require("./src/db");
const { initDiscordClient } = require("./src/discord/client");

const { createApp } = require("./src/core/app");
const { loadModules } = require("./src/core/module-loader");
const { createContainer } = require("./src/core/container");

(async () => {
  const config = loadConfig();
  const ctx = createContainer(config);

  const dbStatus = await initDb(config);
  const discordStatus = await initDiscordClient(config);

  const app = createApp(ctx);
  await loadModules(ctx);

  app.listen(config.port, () => {
    const cyan = "\x1b[36m";
    const yellow = "\x1b[33m";
    const green = "\x1b[32m";
    const red = "\x1b[31m";
    const gray = "\x1b[90m";
    const reset = "\x1b[0m";

    const name = config.website?.name || pkg.name || "Website";
    const version = pkg.version || "0.0.0";
    const author = (pkg.author && (pkg.author.name || pkg.author)) || "Unknown";
    const repo =
      (pkg.repository &&
        (typeof pkg.repository === "string"
          ? pkg.repository
          : pkg.repository.url)) ||
      "https://github.com/your/repo";

    const dbLine = dbStatus.ok
      ? `${green}MySQL connecté${reset}`
      : `${red}MySQL erreur : ${dbStatus.error}${reset}`;

    const discordLine = !discordStatus.enabled
      ? `${gray}désactivé${reset}`
      : discordStatus.ok
        ? `${green}connecté${reset}`
        : `${red}erreur : ${discordStatus.error}${reset}`;

    printBox(
      [
        `${yellow}${name}${reset}  ${cyan}v${version}${reset}`,
        `URL    : ${cyan}${config.baseUrl}${reset}`,
        `Port   : ${cyan}${config.port}${reset}`,
        `DB     : ${dbLine}`,
        `Discord: ${discordLine}`,
        `Auteur : ${cyan}${author}${reset}`,
        `GitHub : ${cyan}${repo}${reset}`,
      ],
      cyan
    );
  });
})();

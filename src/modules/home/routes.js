const express = require("express");
const fs = require("fs");
const path = require("path");
const configuration = require("../../../configuration/config");
const { getCheckSystem } = require('../../function/check.crp')
const { getDiscordClient } = require("../../../src/discord/client");

module.exports = (ctx) => {
  const router = express.Router();

  async function getOnlinePlayersCount() {
    let baseUrl = configuration.module_config.fivem.baseUrl;
    if (!baseUrl) {
      return null;
    }

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

  router.get("/", async (req, res) => {
    const config_global = configuration;
    const name = (config_global.app.name || "G").trim();
    const parts = name.split(/\s+/);
    const global_initial_name = parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
    const themePage = configuration.theme.home.page || "index";
    const viewsDir = path.join(__dirname, "./views");
    const viewPath = path.join(viewsDir, `${themePage}.ejs`);
    const onlineCount = await getOnlinePlayersCount();
    const checkSystem = await getCheckSystem();

    try {
      if (!fs.existsSync(viewPath)) {
        const errorMessages = [
          {
            type: "error",
            text: `La vue <strong>${themePage}.ejs</strong> est introuvable.`
          },
          {
            type: "cause",
            text: `Vérifie dans le dossier configuration <strong>→</strong> page.json
             <strong>→</strong> theme <strong>→</strong> home <strong>→</strong> page.`
          },
          {
            type: "fix",
            text: `Assure-toi que le fichier existe dans <code>src/modules/home/views/</code>.`
          }
        ];

        if (configuration.modules.logs) {
          ctx.fileLogs?.info?.(
            `Vue introuvable ${themePage}.ejs`
          );

          if (ctx.webhooksReady) {
            try {
              const ready = await ctx.webhooksReady;
              if (ready && ctx.webhooks?.erreur?.send) {
                await ctx.webhooks.erreur.send({
                  embeds: [
                    {
                      description: `La vue \`${themePage}.ejs\` est introuvable`,
                      color: 0xef4444
                    }
                  ]
                });
              }
            } catch (e) {
              const msg = e?.message || (() => { try { return JSON.stringify(e); } catch { return String(e); } })();
              ctx.logger?.warn?.(`[login] webhook erreur: ${msg}`);
            }
          }
        }

        return res.status(404).render("404", {
          errorMessages,
          showDocsButton: false,
          showHomeButton: false
        });
      }

      let discordUser = null;
      if (req.user) {
        try {
          const discordClient = getDiscordClient();
          discordUser = await discordClient.users.fetch(req.user.discord_id, { force: true });
        } catch (e) {
          console.warn(e);
        }
      }

      res.render(themePage, {
        checkSystem: checkSystem,
        config_global: config_global,
        global_initial_name: global_initial_name,
        user: discordUser,
        req: req,
        toast: null,
        onlineCount: onlineCount ?? 0,
        status_server: onlineCount === null || onlineCount === undefined,
      });
    } catch (err) {
      console.log(err)
      const errorMessages = [
        {
          type: "error",
          text: `Une erreur est survenue ${err.message ? ` <strong>${err.message}</strong>` : ""}`
        }
      ];

      return res.status(404).render("404", {
        errorMessages,
        showDocsButton: false,
        showHomeButton: false
      });
    }
  });

  return router;
};
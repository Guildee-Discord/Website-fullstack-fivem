const express = require("express");
const fs = require("fs");
const path = require("path");
const config_website = require("../../../configuration/website.json");
const config_fivem = require("../../../configuration/fivem.json");
const config_modules = require("../../../configuration/modules.json");
const config_page = require("../../../configuration/page.json");
const { getDiscordClient } = require("../../../src/discord/client");

module.exports = (ctx) => {
  const router = express.Router();

  async function getOnlinePlayersCount() {
    let baseUrl = config_fivem?.fivem?.baseUrl;
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

  function safeReadJson(filePath, fallback = []) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  router.get("/", async (req, res) => {
    const website = config_website.website || {};
    const themePage = config_page?.theme?.team?.page || "index";
    const viewsDir = path.join(__dirname, "./views");
    const viewPath = path.join(viewsDir, `${themePage}.ejs`);
    const teamPath = path.join(process.cwd(), "configuration", "team.json");
    const team = safeReadJson(teamPath, []);

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

      if (config_modules.modules.logs) {
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

    try {
      const name = (website.name || "W").trim();
      const parts = name.split(/\s+/);
      const websiteInitial =
        parts.length === 1
          ? parts[0][0].toUpperCase()
          : (parts[0][0] + parts[1][0]).toUpperCase();
      const onlineCount = await getOnlinePlayersCount();

      let discordUser = null;
      if (req.user) {
        try {
          const discordClient = getDiscordClient();
          discordUser = await discordClient.users.fetch(req.user.discord_id, { force: true });
        } catch (e) {
          console.warn(e);
        }
      }

      const filePath = path.join(process.cwd(), 'configuration/job.json')
      const raw = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(raw)
      const count = Object.keys(data.job).length

      res.render(themePage, {
        config_page: config_page,
        team,
        countJob: count || 0,
        req,
        toast: null,
        serverDown: onlineCount === null || onlineCount === undefined,
        config_modules: config_modules.modules || {},
        config: website,
        user: discordUser,
        websiteColor: website.color || "#5865f2",
        websiteInitial,
        websiteLogo: website.logoUrl || null,
        requireTos: website.requireTos === true,
        onlineCount: onlineCount ?? 0,
      });
    } catch (err) {
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
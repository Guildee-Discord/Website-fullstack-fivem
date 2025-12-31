const express = require("express");
const passport = require("passport");
const { findLinkedUserByDiscordId } = require("../../models/user");
const config_module = require("../../../configuration/modules.json");

module.exports = (ctx) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    const website = ctx.config.website || {};

    res.render("login", {
      config: ctx.config,
      user: req.user || null,
      websiteColor: website.color || "#5865f2",
      websiteInitial: (website.name || "W")[0].toUpperCase(),
      websiteLogo: website.logoUrl || null,
      requireTos: website.requireTos === true,
    });
  });

  router.get("/auth", passport.authenticate("discord"));

  router.get(
    "/auth/discord/callback",
    passport.authenticate("discord", { failureRedirect: "/connexion" }),
    async (req, res) => {
      // Cache session
      req.session.discordCache = {
        username: req.user?.username || "unknown",
        avatar: req.user?.avatar || null,
        discord_id: req.user?.discord_id,
      };


      if (config_module.modules.logs) {
        ctx.fileLogs?.info?.(
          `✅ Connexion ${req.user?.username || "unknown"} (${req.user?.discord_id || "?"})`
        );

        if (ctx.webhooksReady) {
          try {
            const ready = await ctx.webhooksReady;
            if (ready && ctx.webhooks?.login?.send) {
              await ctx.webhooks.login.send({
                content: `✅ Connexion ${req.user?.username || "unknown"} (**${req.user?.discord_id || "?"}**)`,
              });
            }
          } catch (e) {
            const msg = e?.message || (() => { try { return JSON.stringify(e); } catch { return String(e); } })();
            ctx.logger?.warn?.(`[login] webhook erreur: ${msg}`);
          }
        }
      }

      const linked = await findLinkedUserByDiscordId(req.user?.discord_id);
      if (!linked) return res.redirect("/link");
      return res.redirect("/");
    }
  );

  router.get("/logout", (req, res) => {
    try {
      const username = req.user?.username || "unknown";
      const discordId = req.user?.discord_id || "?";

      req.logout(() => {
        req.session.destroy(() => {
          if (config_module.modules.logs) {
            ctx.fileLogs?.info?.(`[login] Déconnexion: user=${username} id=${discordId}`);
          }

          (async () => {
            try {
              if (config_module.modules.logs) {
                const ready = await ctx.webhooksReady;
                if (ready && ctx.webhooks?.login?.send) {
                  await ctx.webhooks.login.send({
                    content: `🚪 Déconnexion: ${username} (${discordId})`,
                  });
                }
              }
            } catch (_) { }
          })();

          res.redirect("/");
        });
      });
    } catch (_) {
      res.redirect("/");
    }
  });


  return router;
};
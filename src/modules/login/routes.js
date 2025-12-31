const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const { findLinkedUserByDiscordId } = require("../../models/user");
const config_website = require("../../../configuration/website.json");
const config_module = require("../../../configuration/modules.json");
const config_fivem = require("../../../configuration/fivem.json");
const config_bot = require("../../../configuration/bot.json");
const { getDiscordClient } = require("../../../src/discord/client");

if (!passport._discordStrategyConfigured) {
  passport.serializeUser((user, done) => {
    done(null, user?.discord_id);
  });

  passport.deserializeUser(async (discord_id, done) => {
    try {
      const linked = await findLinkedUserByDiscordId(discord_id);
      done(null, linked ? { ...linked, discord_id } : null);
    } catch (e) {
      done(e, null);
    }
  });

  passport.use(
    "discord",
    new DiscordStrategy(
      {
        clientID: config_bot.discord.clientID,
        clientSecret: config_bot.discord.clientSecret,
        callbackURL:
          config_bot.discord.callbackURL ||
          "/connexion/auth/discord/callback",
        scope: ["identify"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const avatarDecoration = profile.avatar_decoration_data ? { asset: profile.avatar_decoration_data.asset, } : null;

          const user = {
            discord_id: profile.id,
            username: profile.username,
            avatar: profile.avatar,
            avatar_decoration: avatarDecoration,
          };


          return done(null, user);
        } catch (e) {
          return done(e, null);
        }
      }
    )
  );

  // petit flag pour éviter double config si ce fichier est importé plusieurs fois
  passport._discordStrategyConfigured = true;
}

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

  router.get("/linked", async (req, res) => {
    const website = config_website.website || {};
    const onlineCount = await getOnlinePlayersCount();

    if (!req.user) {
      return res.redirect("/connexion/auth");
    }

    let discordUser = null;
    try {
      const discordClient = getDiscordClient();
      discordUser = await discordClient.users.fetch(req.user.discord_id, { force: true });
    } catch (e) {
      const errorMessages = [
        {
          type: "error",
          text: `Utilisateur Discord introuvable`
        }
      ];

      if (config_module.modules.logs) {
        ctx.fileLogs?.info?.(
          `Utilisateur Discord introuvable pour l'ID ${req.user.discord_id}`
        );

        if (config_module.modules_features.logs.erreur) {
          if (ctx.webhooksReady) {
            try {
              const ready = await ctx.webhooksReady;
              if (ready && ctx.webhooks?.erreur?.send) {
                await ctx.webhooks.erreur.send({
                  embeds: [
                    {
                      description: `Utilisateur Discord introuvable pour l'ID \`${req.user.discord_id}\``,
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
      }

      return res.status(404).render("404", {
        errorMessages,
        showDocsButton: false,
        showHomeButton: true
      });
    }

    res.render("linked", {
      config: website,
      serverDown: onlineCount === null || onlineCount === undefined,
      user: discordUser,
      websiteColor: website.color || "#5865f2",
      websiteInitial: (website.name || "W")[0].toUpperCase(),
      websiteLogo: website.logoUrl || null,
      requireTos: website.requireTos === true,
    });
  });

  router.post("/linked", async (req, res) => {
    try {
      if (!req.user?.discord_id) return res.redirect("/connexion");

      const fivemId = String(req.body?.fivem_id || "").trim();

      console.log("Liaison Discord -> FiveM pour Discord ID", req.user.discord_id, "avec FiveM ID:", fivemId);

if (!fivemId || fivemId.length < 3) {
  res.toast("error", "Ton identifiant FiveM est invalide.");
  return res.redirect("/connexion/linked");
}

      return res.redirect("/connexion/linked");
    } catch (e) {
      const website = config_website.website || {};
      const onlineCount = await getOnlinePlayersCount();

      return res.status(500).render("linked", {
        config: website,
        serverDown: onlineCount === null || onlineCount === undefined,
        user: req.user || null,
        websiteColor: website.color || "#5865f2",
        websiteInitial: (website.name || "W")[0].toUpperCase(),
        websiteLogo: website.logoUrl || null,
        requireTos: website.requireTos === true,
        error: "Erreur serveur. Réessaie dans un moment.",
      });
    }
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
                embeds: [
                  {
                    description: `Connexion de l'utilisateur \`${req.user?.username || "unknown"}\` (\`${req.user?.discord_id || "?"}\`)`,
                    color: 0x57f287,
                  },
                ],
              });
            }
          } catch (e) {
            const msg =
              e?.message ||
              (() => {
                try {
                  return JSON.stringify(e);
                } catch {
                  return String(e);
                }
              })();
            ctx.logger?.warn?.(`[login] webhook erreur: ${msg}`);
          }
        }
      }

      const linked = await findLinkedUserByDiscordId(req.user?.discord_id);
      if (!linked) return res.redirect("/connexion/linked");
      return res.redirect("/");
    }
  );

  router.get("/logout", (req, res) => {
    try {
      req.logout(() => {
        req.session.destroy(() => {
          res.redirect("/");
        });
      });
    } catch (_) {
      res.redirect("/");
    }
  });

  return router;
};
const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const { findLinkedUserByDiscordId, linkDiscordToIdentifier } = require("../../models/user");

const config_website = require("../../../configuration/website.json");
const config_module = require("../../../configuration/modules.json");
const config_logs = require("../../../configuration/logs.json");
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

  router.get("/", async (req, res) => {
    const website = ctx.config.website || {};
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
        const errorMessages = [
          {
            type: "error",
            text: res.locals.t("linked.var12")
          }
        ];

        return res.status(404).render("404", {
          errorMessages,
          showDocsButton: false,
          showHomeButton: true
        });
      }
    }

    res.render("login", {
      req,
      toast: null,
      serverDown: onlineCount === null || onlineCount === undefined,
      config_modules: config_module.modules || {},
      config: website,
      user: discordUser,
      websiteColor: website.color || "#5865f2",
      websiteInitial,
      websiteLogo: website.logoUrl || null,
      requireTos: website.requireTos === true,
      onlineCount: onlineCount ?? 0,
    });
  });

  router.get("/linked", async (req, res) => {
    const website = config_website.website || {};
    const name = (website.name || "W").trim();
    const parts = name.split(/\s+/);
    const websiteInitial =
      parts.length === 1
        ? parts[0][0].toUpperCase()
        : (parts[0][0] + parts[1][0]).toUpperCase();
    const onlineCount = await getOnlinePlayersCount();

    if (!req.user) {
      return res.redirect("/connexion/auth");
    }

    /*if (req.user.linked) {
      return res.redirect("/");
    }*/

    let discordUser = null;
    if (req.user) {
      try {
        const discordClient = getDiscordClient();
        discordUser = await discordClient.users.fetch(req.user.discord_id, { force: true });
      } catch (e) {
        console.log(e)
      }
    }

    res.render("linked", {
      req,
      toast: null,
      serverDown: onlineCount === null || onlineCount === undefined,
      config_modules: config_module.modules || {},
      config: website,
      user: discordUser,
      websiteColor: website.color || "#5865f2",
      websiteInitial,
      websiteLogo: website.logoUrl || null,
      requireTos: website.requireTos === true,
      onlineCount: onlineCount ?? 0,
    });
  });

  router.post("/linked", async (req, res) => {
    try {
      if (!req.user?.discord_id) return res.redirect("/connexion");

      let discordUser = null;
      if (req.user) {
        try {
          const discordClient = getDiscordClient();
          discordUser = await discordClient.users.fetch(req.user.discord_id, { force: true });
        } catch (e) {
          console.log(e)
        }
      }

      const fivemId = String(req.body?.fivem_id || "").trim();

      if (req.user.linked) {
        res.toast("error", `${res.locals.t("linked.var13")}`);
        return res.redirect("/connexion/linked");
      }

      if (!fivemId || fivemId.length < 3) {
        res.toast("error", `${res.locals.t("linked.var14")}`);
        return res.redirect("/connexion/linked");
      }

      // On récupère username/avatar depuis la session (ou fallback)
      const username = req.user?.username || req.session?.discordCache?.username || "unknown";
      const avatar = req.user?.avatar || req.session?.discordCache?.avatar || null;

      const result = await linkDiscordToIdentifier(
        req.user.discord_id,
        fivemId,
        username,
        avatar
      );

      if (!result.ok) {
        if (result.error === "identifier_not_found") {
          res.toast("error", `${res.locals.t("linked.var15")}`);
          return res.redirect("/connexion/linked");
        }
        if (result.error === "discord_already_linked") {
          res.toast("error", `${res.locals.t("linked.var16")}`);
          return res.redirect("/connexion/linked");
        }

        res.toast("error", `${res.locals.t("linked.var17")}`);
        return res.redirect("/connexion/linked");
      }

      if (config_module.modules.logs) {
        if (config_logs.logs.module_logs.link) {
          ctx.fileLogs?.info?.(
            `L'utilisateur **${discordUser.username}** vient d'associer son compte`
          );

          if (ctx.webhooksReady) {
            try {
              const ready = await ctx.webhooksReady;
              if (ready && ctx.webhooks?.login?.send) {
                await ctx.webhooks.login.send({
                  embeds: [
                    {
                      description: `L'utilisateur **${discordUser.username}** vient d'associer son compte`,
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
      }

      res.toast("success", `${res.locals.t("linked.var18")}`);
      return res.redirect("/?delayRedirect=1");
    } catch (e) {
      res.toast("error", res.locals.t("linked.var19", { err: e }));
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
        if (config_logs.logs.module_logs.login) {
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
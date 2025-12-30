const express = require("express");
const passport = require("passport");
const { findLinkedUserByDiscordId } = require("../../models/user");

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

  // /connexion/auth
  router.get("/auth", passport.authenticate("discord"));

  // /connexion/auth/discord/callback
  router.get(
    "/auth/discord/callback",
    passport.authenticate("discord", { failureRedirect: "/connexion" }),
    async (req, res) => {
      req.session.discordCache = {
        username: req.user?.username || "unknown",
        avatar: req.user?.avatar || null,
        discord_id: req.user?.discord_id,
      };

      const linked = await findLinkedUserByDiscordId(req.user?.discord_id);
      if (!linked) return res.redirect("/link");
      return res.redirect("/");
    }
  );

  return router;
};
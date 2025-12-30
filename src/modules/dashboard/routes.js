const express = require("express");
const passport = require("passport");
const { findLinkedUserByDiscordId } = require("../../models/user");

module.exports = (ctx) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    const website = ctx.config.website || {};

    res.render("dashboard", {
      config: ctx.config,
      user: req.user || null,
      websiteColor: website.color || "#5865f2",
      websiteInitial: (website.name || "W")[0].toUpperCase(),
      websiteLogo: website.logoUrl || null,
      requireTos: website.requireTos === true,
    });
  });

  return router;
};
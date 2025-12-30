const express = require("express");
const passport = require("passport");
const { findLinkedUserByDiscordId } = require("../../models/user");
const config_website = require("../../../configuration/website.json");
const config_fivem = require("../../../configuration/fivem.json");

module.exports = (ctx) => {
  const router = express.Router();

  async function getOnlinePlayersCount() {
    const baseUrl = config_fivem.fivem.baseUrl;
    if (!baseUrl) return null;

    try {
      const res = await fetch(`${baseUrl}/players.json`, { method: "GET" });
      if (!res.ok) return null;

      const players = await res.json();
      return Array.isArray(players) ? players.length : null;
    } catch (e) {
      return null;
    }
  }

  router.get("/", async (req, res) => {
    const website = config_website.website || {};

    console.log(website.gradient.accent)

    const name = (website.name || "W").trim();
    const parts = name.split(/\s+/);
    const websiteInitial =
      parts.length === 1
        ? parts[0][0].toUpperCase()
        : (parts[0][0] + parts[1][0]).toUpperCase();

    const onlineCount = await getOnlinePlayersCount();

    res.render("index", {
      config: website,
      user: req.user || null,
      websiteColor: website.color || "#5865f2",
      websiteInitial,
      websiteLogo: website.logoUrl || null,
      requireTos: website.requireTos === true,

      onlineCount: onlineCount ?? 0
    });
  });

  return router;
};
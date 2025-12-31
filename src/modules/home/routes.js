const express = require("express");
const config_website = require("../../../configuration/website.json");
const config_fivem = require("../../../configuration/fivem.json");
const config_modules = require("../../../configuration/modules.json");

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

  router.get("/", async (req, res) => {
    const website = config_website.website || {};
    const name = (website.name || "W").trim();
    const parts = name.split(/\s+/);
    const websiteInitial =
      parts.length === 1
        ? parts[0][0].toUpperCase()
        : (parts[0][0] + parts[1][0]).toUpperCase();
    const onlineCount = await getOnlinePlayersCount();

    res.render("index", {
      toast: null,
      serverDown: onlineCount === null || onlineCount === undefined,
      config_modules: config_modules.modules || {},
      config: website,
      user: req.user || null,
      websiteColor: website.color || "#5865f2",
      websiteInitial,
      websiteLogo: website.logoUrl || null,
      requireTos: website.requireTos === true,
      onlineCount: onlineCount ?? 0,
    });
  });

  return router;
};
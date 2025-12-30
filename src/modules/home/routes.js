const express = require("express");
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const config_website = require("../../../configuration/website.json");
const config_fivem = require("../../../configuration/fivem.json");

function loadTexts(lang = "fr") {
  const file = path.join(process.cwd(), "src/modules/home", `home.yml`);
  const raw = fs.readFileSync(file, "utf8");
  return YAML.parse(raw);
}

module.exports = (ctx) => {
  const router = express.Router();
  const texts = loadTexts("fr");

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
      onlineCount: onlineCount ?? 0,
      texts: texts
    });
  });

  return router;
};
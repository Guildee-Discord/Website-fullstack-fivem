const express = require("express");
const fs = require("fs");
const path = require("path");

const config_website = require("../../../configuration/website.json");
const config_fivem = require("../../../configuration/fivem.json");
const config_modules = require("../../../configuration/modules.json");
const config_page = require("../../../configuration/page.json");
const config_shop = require("../../../configuration/shop.json");

const { getDiscordClient } = require("../../../src/discord/client");

module.exports = (ctx) => {
  const router = express.Router();

  async function getOnlinePlayersCount() {
    let baseUrl = config_fivem?.fivem?.baseUrl;
    if (!baseUrl) return null;

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

  const crypto = require("crypto");

  function toNumber(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeShop(shopConfig = {}) {
    const defaults = shopConfig.default || {};
    const settings = shopConfig.settings || {};

    const decimals = Number.isFinite(settings.decimals) ? settings.decimals : 2;
    const allowNegativePrice = settings.allowNegativePrice === true;

    const items = Array.isArray(shopConfig.items) ? shopConfig.items : [];

    return items
      .filter((i) => (i?.enabled ?? defaults.enabled ?? true) !== false)
      .map((i) => {
        const basePrice = toNumber(i.price, toNumber(defaults.price, 0));

        // Promotion (override item > default)
        const promo = i.promotion ?? defaults.promotion ?? null;

        let finalPrice = basePrice;
        let promoLabel = null;
        let hasPromotion = false;

        if (promo && promo.type) {
          if (promo.type === "percent") {
            const pct = toNumber(promo.value, 0);
            finalPrice = basePrice - (basePrice * pct) / 100;
            promoLabel = promo.label || `-${pct}%`;
            hasPromotion = pct > 0;
          } else if (promo.type === "fixed") {
            const off = toNumber(promo.value, 0);
            finalPrice = basePrice - off;
            promoLabel = promo.label || `-${off}${shopConfig.currency || "€"}`;
            hasPromotion = off > 0;
          }
        }

        if (!allowNegativePrice && finalPrice < 0) finalPrice = 0;

        // Round propre (évite les 9.989999)
        const round = (n) => Number((toNumber(n, 0)).toFixed(decimals));
        const roundedBase = round(basePrice);
        const roundedFinal = round(finalPrice);

        return {
          id: i.id || `item_${crypto.randomUUID()}`,
          name: (i.name || "Article sans nom").trim(),

          // prix
          price: roundedBase,
          finalPrice: roundedFinal,
          hasPromotion: hasPromotion && roundedFinal !== roundedBase,
          promoLabel,

          // contenu
          icon: i.icon || defaults.icon || "fa-solid fa-cart-shopping",
          features: Array.isArray(i.features) ? i.features : (defaults.features || []),

          // bouton
          buttonText: i.buttonText || defaults.buttonText || "Acheter",
          link: i.link || defaults.link || "#",

          enabled: i.enabled ?? defaults.enabled ?? true
        };
      });
  }


  router.get("/", async (req, res) => {
    const website = config_website.website || {};
    const themePage = config_page?.theme?.shop.page || "index";

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

      // ✅ Shop injecté dans la page
      const shopItems = normalizeShop(config_shop);
      const shopCurrency = config_shop.currency || "€";

      res.render(themePage, {
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

        // ✅ variables shop utilisées dans ton EJS
        shopItems,
        shopCurrency
      });
    } catch (err) {
      const errorMessages = [
        {
          type: "error",
          text: `Une erreur est survenue ${err.message ? ` <strong>${err.message}</strong>` : ""
            }`
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
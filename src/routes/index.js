const express = require("express");
const passport = require("passport");
const { getDb } = require("../db");
const { ensureAuth, ensureLinked } = require("../middlewares/auth");
const { linkDiscordToIdentifier, findLinkedUserByDiscordId } = require("../models/user");
const config = require("../../configuration/config.json");

const router = express.Router();

router.get("/", ensureAuth, (req, res) => {
  res.render("pages/index", { user: req.user });
});

router.get("/connexion", (req, res) => {
  const websiteName = config.website?.name || "Website";
  const websiteColor = config.website?.color || "#6366f1";
  const websiteLogo = config.website?.logoUrl || null;
  const websiteInitial = websiteName.charAt(0).toUpperCase();
  const requireTos = config.website?.require.tos !== false; // true par défaut

  res.render("pages/connexion/login", {
    config,
    user: req.user || null,
    websiteInitial,
    websiteColor,
    websiteLogo,
    requireTos
  });
});

router.get("/dashboard", ensureLinked, (req, res) => {
  res.render("pages/dashboard", { user: req.user });
});

router.get("/link", ensureAuth, (req, res) => {
  res.render("pages/link", { user: req.user || null, error: null });
});

// Auth
router.get("/login", passport.authenticate("discord"));

router.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  async (req, res) => {
    // ✅ garder username/avatar même si pas "linked"
    req.session.discordCache = {
      username: req.user?.username || "unknown",
      avatar: req.user?.avatar || null,
      discord_id: req.user?.discord_id
    };

    // ensuite ton check linked habituel
    const linked = await findLinkedUserByDiscordId(req.user?.discord_id);
    if (!linked) return res.redirect("/link");
    return res.redirect("/dashboard");
  }
);

router.post("/link", ensureAuth, async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier || "").trim();
    if (!identifier) return res.status(400).send("identifier manquant");

    const discordId = req.session?.passport?.user; // discord_id
    if (!discordId) return res.redirect("/");

    // ✅ récupère username/avatar depuis la session (cache)
    const cache = req.session.discordCache || {};
    const username = cache.username || "unknown";
    const avatar = cache.avatar || null;

    const result = await linkDiscordToIdentifier(discordId, identifier, username, avatar);

    // optionnel: si ton link renvoie ok:false
    if (result?.ok === false) {
      return res.render("pages/link", { user: req.user, error: result.error });
    }

    return res.redirect("/dashboard");
  } catch (e) {
    next(e);
  }
});

router.post("/unlink", ensureAuth, async (req, res, next) => {
  try {
    const db = getDb();

    // discord_id stocké par passport.serializeUser
    const discordId = req.session?.passport?.user;
    if (!discordId) return res.redirect("/");

    // Délier dans users (on ne touche PAS à identifier)
    await db.execute(
      `UPDATE users
       SET discord_id = NULL,
           discord_username = NULL,
           discord_avatar = NULL
       WHERE discord_id = ?
       LIMIT 1`,
      [String(discordId)]
    );

    // Nettoyage session/cache
    if (req.session) delete req.session.discordCache;

    // Logout Passport (v0.6+ async)
    req.logout((err) => {
      if (err) return next(err);
      return res.redirect("/");
    });
  } catch (e) {
    return next(e);
  }
});

router.get("/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    res.redirect("/");
  });
});

module.exports = router;

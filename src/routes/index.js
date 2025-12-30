const express = require("express");
const path = require("path");
const passport = require("passport");
const { ensureAuth } = require("../middlewares/auth");

const router = express.Router();

// Pages
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "public", "index.html"));
});

router.get("/dashboard", ensureAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "public", "dashboard.html"));
});

// Auth
router.get("/login", passport.authenticate("discord"));

router.get("/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => res.redirect("/dashboard")
);

router.get("/logout", (req, res, next) => {
  // Passport 0.6+ => logout async
  req.logout(function(err) {
    if (err) return next(err);
    res.redirect("/");
  });
});

// API minimal
router.get("/api/me", (req, res) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "not_authenticated" });
  return res.json({ ok: true, user: req.user });
});

module.exports = router;

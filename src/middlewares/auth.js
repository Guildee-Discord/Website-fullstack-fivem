function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.redirect("/login");
}

function ensureLinked(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) return next();
  if (req.isAuthenticated && req.isAuthenticated()) return res.redirect("/link");
  return res.redirect("/");
}

module.exports = { ensureAuth, ensureLinked };

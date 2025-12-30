const { AppEvents } = require("./events");

function createContainer(config) {
  const logger = {
    info: (m) => console.log("ℹ️ ", m),
    warn: (m) => console.warn("⚠️ ", m),
    error: (m) => console.error("❌", m),
  };

  return {
    config,
    viewPaths: [],
    logger,
    events: new AppEvents({ logger }),

    viewHooks: {
      head: [],
      navbar: [],
      footer: [],
      dashboard: [],
    },

    middlewares: {
      ensureAuth(req, res, next) {
        if (req.isAuthenticated && req.isAuthenticated()) return next();
        res.redirect("/connexion");
      }
    }
  };
}

module.exports = { createContainer };
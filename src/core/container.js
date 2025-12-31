const { AppEvents } = require("./events");

function createContainer(config) {
  const logger = {
    info: (m) => console.log("ℹ️ ", m),
    warn: (m) => console.warn("⚠️ ", m),
    error: (m) => console.error("❌", m),
  };

  const ctx = {
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

    // Webhooks (sera rempli par le module logs/webhook)
    webhooks: null,

    // Promise résolue quand le module webhook est prêt
    webhooksReady: null,
    _resolveWebhooksReady: null,

    middlewares: {
      ensureAuth(req, res, next) {
        try {
          if (req?.isAuthenticated?.() === true) return next();
        } catch (_) {}
        return res.redirect("/connexion");
      },
    },
  };

  // init promise "ready"
  ctx.webhooksReady = new Promise((resolve) => {
    ctx._resolveWebhooksReady = resolve;
  });

  return ctx;
}

module.exports = { createContainer };
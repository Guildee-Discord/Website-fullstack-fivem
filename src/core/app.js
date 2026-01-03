const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const toast = require("./toastMiddleware");
const { configureDiscordAuth } = require("../auth/discord");
const i18n = require("./../middlewares/i18n");
const configuration = require('../../configuration/config')

function createApp(ctx) {
  const app = express();

  ctx.app = app;
  ctx.express = express;

  const coreViews = path.join(__dirname, "..", "views");
  ctx.coreViews = coreViews;

  ctx.viewPaths = ctx.viewPaths || [];
  if (!ctx.viewPaths.includes(coreViews)) ctx.viewPaths.unshift(coreViews);

  app.set("view engine", "ejs");
  app.set("views", ctx.viewPaths);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(
    session({
      secret: configuration.app.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 },
    })
  );
  app.use(toast);
  app.use(i18n());
  app.use(passport.initialize());
  app.use(passport.session());

  configureDiscordAuth(passport, ctx.config);

  app.use("/public", express.static(path.join(__dirname, "..", "..", "public")));

  app.use((req, res, next) => {
    res.locals.config = ctx.config;
    res.locals.user = req.user || null;
    res.locals.coreView = (p) => path.join(coreViews, p);
    next();
  });

  return app;
}

module.exports = { createApp };
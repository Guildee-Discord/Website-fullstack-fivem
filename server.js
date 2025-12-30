const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");

const { loadConfig } = require("./src/config");
const { initDb } = require("./src/db");
const { configureDiscordAuth } = require("./src/auth/discord");
const indexRoutes = require("./src/routes");

const app = express();
const config = loadConfig();

// DB (pool global)
initDb(config);

// Sessions
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(passport.initialize());
app.use(passport.session());

configureDiscordAuth(passport, config);

app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/", indexRoutes);

app.listen(config.port, () => {
  console.log(`✅ Serveur: ${config.baseUrl} (port ${config.port})`);
});
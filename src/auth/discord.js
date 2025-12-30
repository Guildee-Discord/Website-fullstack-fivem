const DiscordStrategy = require("passport-discord").Strategy;
const { upsertUserByDiscordProfile, findUserById } = require("../models/user");

function configureDiscordAuth(passport, config) {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await findUserById(id);
      done(null, user || null);
    } catch (e) {
      done(e);
    }
  });

  passport.use(new DiscordStrategy(
    {
      clientID: config.discord.clientID,
      clientSecret: config.discord.clientSecret,
      callbackURL: config.discord.callbackURL,
      scope: config.discord.scope
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await upsertUserByDiscordProfile(profile);
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
  ));
}

module.exports = { configureDiscordAuth };

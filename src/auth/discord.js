const DiscordStrategy = require("passport-discord").Strategy;
const { upsertDiscordProfile, findLinkedUserByDiscordId } = require("../models/user");
const configuration = require("../../configuration/config");

function configureDiscordAuth(passport, config) {
  passport.serializeUser((user, done) => done(null, user.discord_id));

  passport.deserializeUser(async (discordId, done) => {
    try {
      const linkedUser = await findLinkedUserByDiscordId(discordId);

      if (!linkedUser) {
        return done(null, { discord_id: String(discordId), linked: false });
      }

      return done(null, linkedUser);
    } catch (e) {
      done(e);
    }
  });

  passport.use(
    new DiscordStrategy(
      {
        clientID: configuration.bot.clientID,
        clientSecret: configuration.bot.clientSecret,
        callbackURL: configuration.bot.callbackURL,
        scope: configuration.bot.scope,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await upsertDiscordProfile(profile);
          return done(null, user);
        } catch (e) {
          return done(e);
        }
      }
    )
  );
}

module.exports = { configureDiscordAuth };
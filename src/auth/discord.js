const DiscordStrategy = require("passport-discord").Strategy;
const { upsertDiscordProfile, findLinkedUserByDiscordId } = require("../models/user");
const config_botdiscord = require("../../configuration/botdiscord.json");

function configureDiscordAuth(passport, config) {
  // Toujours stocker le discord_id
  passport.serializeUser((user, done) => done(null, user.discord_id));

  passport.deserializeUser(async (discordId, done) => {
    try {
      const linkedUser = await findLinkedUserByDiscordId(discordId);

      // Si pas lié, on renvoie un user minimal au lieu de null
      // (comme ça req.isAuthenticated() reste vrai)
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
        clientID: config_botdiscord.discord.clientID,
        clientSecret: config_botdiscord.discord.clientSecret,
        callbackURL: config_botdiscord.discord.callbackURL,
        scope: config_botdiscord.discord.scope,
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
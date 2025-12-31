const { checkModuleUpdate } = require("../../function/github");
const config_modules = require("../../../configuration/modules.json");

module.exports = {
  meta: require("./module.json"),
  viewsPath: __dirname + "/views",

  async init(ctx) {
    const router = require("./routes")(ctx);
    ctx.app.use("/connexion", router);

    if (config_modules.modules.logs) {
      await ctx.webhooksReady;
      try {
        await ctx.webhooks?.login?.send?.({ content: "✅ Module Login démarré test" });
      } catch (e) {
        const msg = e?.message || JSON.stringify(e);
        ctx.logger?.warn?.(`[login] webhook erreur: ${msg}`);
      }
    }

    await checkModuleUpdate({
      logger: ctx.logger,
      meta: module.exports.meta,
      debug: false,
    });
  }
};
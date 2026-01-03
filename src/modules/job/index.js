const { checkModuleUpdate } = require("../../function/github");
const config_modules = require("../../../configuration/modules.json");

module.exports = {
  meta: require("./module.json"),
  viewsPath: __dirname + "/views",

  async init(ctx) {
    const router = require("./routes")(ctx);
    ctx.app.use("/jobs", router);

    await checkModuleUpdate({
      logger: ctx.logger,
      meta: module.exports.meta,
      debug: false,
    });
  }
};
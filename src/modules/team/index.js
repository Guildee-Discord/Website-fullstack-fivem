const { checkModuleUpdate } = require("../../function/github");

module.exports = {
  meta: require("./module.json"),
  viewsPath: __dirname + "/views",

  async init(ctx) {
    const router = require("./routes")(ctx);
    ctx.app.use("/team", router);

    await checkModuleUpdate({
      logger: ctx.logger,
      meta: module.exports.meta,
      debug: false,
    });
  }
};
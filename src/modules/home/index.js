module.exports = {
  meta: require("./module.json"),
  viewsPath: __dirname + "/views",

  init(ctx) {
    // Routes du module
    const router = require("./routes")(ctx);
    ctx.app.use("/", router);

    ctx.logger?.info?.("[module] home loaded");
  }
};
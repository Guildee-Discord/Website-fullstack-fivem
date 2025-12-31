const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";
const version = require("./module.json");

module.exports = {
  meta: require("./module.json"),
  viewsPath: __dirname + "/views",

  init(ctx) {
    const router = require("./routes")(ctx);
    ctx.app.use("/connexion", router);

    ctx.logger?.info?.(`${BLUE}[module]${RESET} login - version ${GREEN}${version.version}${RESET}`);
  }
};
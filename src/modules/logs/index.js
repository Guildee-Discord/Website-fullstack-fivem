const fs = require("fs");
const path = require("path");

const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";
const version = require("./module.json");

module.exports = {
  meta: require("./module.json"),
  init(ctx) {
    ctx.logger?.info?.(`${BLUE}[module]${RESET} logs - version ${GREEN}${version.version}${RESET}`);
  }
};
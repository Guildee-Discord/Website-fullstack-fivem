const fs = require("fs");
const path = require("path");
const configuration = require("../../configuration/config");

function loadModules(ctx) {
  const modulesDir = path.join(__dirname, "..", "modules");
  const enabled = configuration.modules || {};

  if (!fs.existsSync(modulesDir)) return;

  const mods = fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => require(path.join(modulesDir, d.name)))
    .filter(m => enabled[m.meta.name] !== false);

  for (const mod of mods) {
    if (mod.viewsPath) ctx.viewPaths.push(mod.viewsPath);
    if (mod.publicPath) ctx.app.use(`/public/modules/${mod.meta.name}`, ctx.express.static(mod.publicPath));
  }

  ctx.app.set("views", ctx.viewPaths);

  for (const mod of mods) {
    mod.init(ctx);
  }
}

module.exports = { loadModules };
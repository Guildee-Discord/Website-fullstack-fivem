const fs = require("fs");
const path = require("path");

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function stripAnsi(str) {
  return String(str).replace(/\x1b\[[0-9;]*m/g, "");
}
function padRight(str, width) {
  const plain = stripAnsi(str);
  const padLen = Math.max(0, width - plain.length);
  return str + " ".repeat(padLen);
}
function truncateTo(str, width) {
  const plain = stripAnsi(str);
  if (plain.length <= width) return str;
  return plain.slice(0, Math.max(0, width - 1)) + "…";
}
function printWarnBox(title, lines, { color = RED } = {}) {
  const content = [title, "", ...lines];
  const maxLen = content.reduce((m, l) => Math.max(m, stripAnsi(l).length), 0);
  const width = Math.min(Math.max(maxLen, 40), 78);

  const top = `╔${"═".repeat(width + 2)}╗`;
  const mid = `╠${"═".repeat(width + 2)}╣`;
  const bot = `╚${"═".repeat(width + 2)}╝`;

  const formatLine = (line) => {
    const t = truncateTo(line, width);
    return `║ ${padRight(t, width)} ║`;
  };

  const out = [
    `${color}${top}${RESET}`,
    `${color}${formatLine(title)}${RESET}`,
    `${color}${mid}${RESET}`,
    ...content.slice(1).map((l) => `${color}${formatLine(l)}${RESET}`),
    `${color}${bot}${RESET}`,
  ].join("\n");

  console.warn(out);
}

function loadModules(ctx) {
  const modulesDir = path.join(__dirname, "..", "modules");

  // ✅ config from container
  const enabled = ctx?.config?.modules || {};

  if (!fs.existsSync(modulesDir)) return;

  const folders = fs
    .readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  // 1) If config enables something but folder missing => disable + big warning
  for (const [name, isEnabled] of Object.entries(enabled)) {
    if (isEnabled !== false && !folders.includes(name)) {
      printWarnBox("MODULE CONFIG ERROR", [
        "Module enabled in configuration but folder is missing.",
        "",
        `Name   : ${YELLOW}${name}${RED}`,
        `Path   : ${modulesDir}/${name}`,
        "Action : Treated as DISABLED to prevent crash.",
        "",
        `Fix    : Create the folder OR set modules.${name} = false`,
      ]);
      enabled[name] = false;
    }
  }

  // 2) Load modules strictly by folder name (config key)
  const mods = folders
    .filter((folderName) => enabled[folderName] !== false) // ✅ folder decides
    .map((folderName) => {
      const entryPath = path.join(modulesDir, folderName);

      try {
        const mod = require(entryPath);

        // Ensure meta exists; if not, create it
        if (!mod.meta) mod.meta = {};
        if (!mod.meta.name) mod.meta.name = folderName;

        // If meta.name differs, we force it to folderName to keep routes consistent
        if (mod.meta.name !== folderName) {
          printWarnBox("MODULE META OVERRIDDEN", [
            "meta.name did not match folder name. Using folder name instead.",
            "",
            `Folder   : ${YELLOW}${folderName}${RED}`,
            `meta.name: ${YELLOW}${mod.meta.name}${RED}`,
            "",
            "Action : meta.name has been forced to folder name.",
          ]);
          mod.meta.name = folderName;
        }

        if (typeof mod.init !== "function") {
          printWarnBox("MODULE INVALID", [
            `Folder : ${folderName}`,
            "Missing init(ctx) function in module export.",
            "Action : Module skipped.",
          ]);
          return null;
        }

        return mod;
      } catch (e) {
        printWarnBox("MODULE LOAD FAILED", [
          `Folder: ${folderName}`,
          `Error : ${e.message}`,
        ]);
        return null;
      }
    })
    .filter(Boolean);

  // 3) Register view/public paths
  for (const mod of mods) {
    if (mod.viewsPath) ctx.viewPaths.push(mod.viewsPath);
    if (mod.publicPath) {
      ctx.app.use(
        `/public/modules/${mod.meta.name}`,
        ctx.express.static(mod.publicPath)
      );
    }
  }

  ctx.app.set("views", ctx.viewPaths);

  // 4) Init
  for (const mod of mods) {
    try {
      mod.init(ctx);
    } catch (e) {
      printWarnBox("MODULE INIT FAILED", [
        `Module: ${mod.meta?.name || "unknown"}`,
        `Error : ${e.message}`,
      ]);
    }
  }
}

module.exports = { loadModules };
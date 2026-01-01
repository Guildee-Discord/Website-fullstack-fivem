const fs = require("fs");
const path = require("path");

const LOCALES_ROOT = path.join(__dirname, "..", "locales");
const CONFIG_PATH = path.join(__dirname, "..", "..", "configuration", "language.json");

let cache = { mtime: 0, dicts: null };

function readLangConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const cfg = JSON.parse(raw);
    return {
      supported: Array.isArray(cfg.supported) ? cfg.supported : ["fr", "en"],
      default: cfg.default || "fr",
    };
  } catch {
    return { supported: ["fr", "en"], default: "fr" };
  }
}

function isJson(file) {
  return file.toLowerCase().endsWith(".json");
}

function getLatestMtime(dir) {
  if (!fs.existsSync(dir)) return 0;
  let latest = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) latest = Math.max(latest, getLatestMtime(full));
    else if (entry.isFile() && isJson(full)) latest = Math.max(latest, fs.statSync(full).mtimeMs);
  }

  return latest;
}

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function loadLang(lang) {
  const baseDir = path.join(LOCALES_ROOT, lang);
  const dict = {};

  if (!fs.existsSync(baseDir)) return dict;

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      if (!entry.isFile() || !isJson(full)) continue;

      const rel = path.relative(baseDir, full).replace(/\\/g, "/").replace(/\.json$/i, "");
      const prefix = rel.split("/").join(".");

      try {
        const content = JSON.parse(fs.readFileSync(full, "utf8"));
        const flat = flatten(content);

        for (const [k, v] of Object.entries(flat)) {
          dict[prefix ? `${prefix}.${k}` : k] = v;
        }
      } catch (e) {
        console.error("[i18n] JSON invalide:", full, e.message);
      }
    }
  }

  walk(baseDir);
  return dict;
}

function loadAll() {
  const mtime = getLatestMtime(LOCALES_ROOT);
  if (cache.dicts && cache.mtime === mtime) return cache.dicts;

  const { supported } = readLangConfig();
  const dicts = {};

  for (const lang of supported) {
    dicts[lang] = loadLang(lang);
  }

  cache = { mtime, dicts };
  return dicts;
}

function pickLang(req) {
  const cfg = readLangConfig();

  const q = String(req.query?.lang || "").toLowerCase();
  if (cfg.supported.includes(q)) return q;

  return cfg.default;
}


module.exports = function i18n() {
  return (req, res, next) => {
    const dicts = loadAll();
    const lang = pickLang(req);

    req.lang = lang;
    res.locals.lang = lang;

    res.locals.withLang = (url) => {
      const has = url.includes("?");
      return `${url}${has ? "&" : "?"}lang=${lang}`;
    };

    res.locals.t = (key, vars = {}) => {
      let str = dicts[lang]?.[key] ?? dicts[readLangConfig().default]?.[key] ?? key;
      str = String(str);
      for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, String(v));
      return str;
    };

    next();
  };
};

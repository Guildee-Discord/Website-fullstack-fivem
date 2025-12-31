const fs = require("fs");
const path = require("path");

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function createFileLogger({ baseDir = "logs" } = {}) {
  ensureDir(baseDir);

  function write(line) {
    const day = getToday();
    const file = path.join(baseDir, `${day}.log`);

    const time = new Date().toISOString().replace("T", " ").slice(0, 19);
    const entry = `[${time}] ${line}\n`;

    fs.appendFile(file, entry, (err) => {
      if (err) console.error("fileLogger error:", err.message);
    });
  }

  function log(level, message) {
    write(`${level.toUpperCase()} - ${message}`);
  }

  return {
    info: (msg) => log("info", msg),
    warn: (msg) => log("warn", msg),
    error: (msg) => log("error", msg),
    raw: write,
  };
}

module.exports = { createFileLogger };
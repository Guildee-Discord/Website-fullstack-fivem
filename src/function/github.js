const https = require("https");

const COLOR = {
  RESET: "\x1b[0m",
  BLUE: "\x1b[34m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  RED: "\x1b[31m",
};

function httpGetText(url, { timeoutMs = 7000 } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "module-version-checker",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(`HTTP ${res.statusCode}`));
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error("timeout")));
  });
}

async function checkModuleUpdate({ logger, meta, debug = false }) {
  const name = meta?.name || "module";
  const localVersion = String(meta?.version || "").trim();
  const versionUrl = meta?.update?.versionUrl;
  const repoUrl = meta?.update?.repoUrl;

  const tag = `${COLOR.BLUE}[module]${COLOR.RESET}`;
  const hint = `${name}`;

  if (!versionUrl || !localVersion) {
    logger?.warn?.(`${tag} ${hint} - missing version information`);
    return;
  }

  try {
    const url = `${versionUrl}${versionUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
    const remoteRaw = await httpGetText(url);
    const remoteVersion = remoteRaw.trim().split(/\r?\n/)[0].trim();

    if (debug) {
      logger?.info?.(`${tag} ${hint} - url=${url}`);
      logger?.info?.(`${tag} ${hint} - remote="${remoteVersion}"`);
    }

    if (!remoteVersion) {
      logger?.warn?.(`${tag} ${hint} - remote VERSION is empty`);
      return;
    }

    if (remoteVersion === localVersion) {
      logger?.info?.(`${tag} ${hint} - ${COLOR.GREEN}up to date${COLOR.RESET} (${localVersion})`);
    } else {
      const repoMsg = repoUrl ? ` → ${repoUrl}` : "";
      logger?.warn?.(
        `${tag} ${hint} - ${COLOR.RESET}new version available${COLOR.RESET} (${COLOR.RED}${localVersion}${COLOR.RESET} → ${COLOR.GREEN}${remoteVersion}${COLOR.RESET})${COLOR.BLUE}${repoMsg}${COLOR.RESET}`
      );
    }
  } catch (e) {
    logger?.warn?.(`${tag} ${hint} - unable to check version (${e.message})`);
  }
}

module.exports = { checkModuleUpdate };
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const INPUT = path.resolve(process.argv[2] || "server.js");
const OUTPUT = path.resolve(process.argv[3] || "server.packed.js");

const src = fs.readFileSync(INPUT, "utf8");

// gzip + base64 (réversible)
const gz = zlib.gzipSync(Buffer.from(src, "utf8"));
const b64 = gz.toString("base64");

const packed = `
/*
╔══════════════════════════════════════════════════════════╗
║        Website : Guildee                                 ║
║        Autheur : Yusu_sauvage                            ║
╚══════════════════════════════════════════════════════════╝
*/
const zlib = require("zlib");
const vm = require("vm");

const PAYLOAD_B64 = "${b64}";

function runPacked() {
  const gz = Buffer.from(PAYLOAD_B64, "base64");
  const code = zlib.gunzipSync(gz).toString("utf8");

  const script = new vm.Script(code, { filename: "${path.basename(INPUT)}" });
  const context = vm.createContext({
    require,
    module,
    exports,
    __dirname,
    __filename,
    process,
    console,
    Buffer,
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
  });

  script.runInContext(context);
}

runPacked();
`;

fs.writeFileSync(OUTPUT, packed, "utf8");
console.log("OK ->", OUTPUT);
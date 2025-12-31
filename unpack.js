// unpack.js
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const INPUT = path.resolve(process.argv[2] || "index.packed.js");
const OUTPUT = path.resolve(process.argv[3] || "index.unpacked.js");

const packed = fs.readFileSync(INPUT, "utf8");

// récupère PAYLOAD_B64 = "...."
const match = packed.match(/const PAYLOAD_B64 = "([^"]+)";/);
if (!match) {
  console.error("Impossible de trouver PAYLOAD_B64 dans", INPUT);
  process.exit(1);
}

const b64 = match[1];
const gz = Buffer.from(b64, "base64");
const code = zlib.gunzipSync(gz).toString("utf8");

fs.writeFileSync(OUTPUT, code, "utf8");
console.log("OK ->", OUTPUT);

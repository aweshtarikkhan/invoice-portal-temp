
const { Client } = require("ssh2");
const conn = new Client();
conn.on("ready", () => {
  conn.exec("cd /www/wwwroot/sth-test-pltfrom && git pull origin main && npm run build", (err, stream) => {
    if (err) throw err;
    stream.on("close", () => conn.end()).on("data", data => console.log("" + data));
  });
}).connect({ host: "89.116.32.98", port: 22, username: "root", password: "CabNet@2025#" });


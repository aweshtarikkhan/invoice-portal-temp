
const { Client } = require("ssh2");
const conn = new Client();
conn.on("ready", () => {
  conn.exec("pm2 restart all", (err, stream) => {
    if (err) throw err;
    stream.on("close", () => conn.end()).on("data", data => console.log("" + data));
  });
}).connect({ host: "89.116.32.98", port: 22, username: "root", password: "CabNet@2025#" });


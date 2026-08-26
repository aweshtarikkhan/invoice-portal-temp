
const { Client } = require("ssh2");
const conn = new Client();
conn.on("ready", () => {
  conn.exec("ls -la /www/wwwroot/invoice-portal-temp", (err, stream) => {
    stream.on("data", (data) => console.log(data.toString()));
    stream.on("close", () => {
      conn.exec("pm2 list", (err, stream2) => {
        stream2.on("data", (data) => console.log(data.toString()));
        stream2.on("close", () => conn.end());
      });
    });
  });
}).connect({ host: "89.116.32.98", port: 22, username: "root", password: "CabNet@2025#" });


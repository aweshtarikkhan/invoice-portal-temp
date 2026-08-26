
const { Client } = require("ssh2");
const conn = new Client();
conn.on("ready", () => {
  conn.exec("cd /www/wwwroot/invoice-portal-temp && git pull && npm run build", (err, stream) => {
    stream.on("data", (data) => console.log(data.toString()));
    stream.on("close", () => {
      conn.end();
    });
  });
}).connect({ host: "89.116.32.98", port: 22, username: "root", password: "CabNet@2025#" });


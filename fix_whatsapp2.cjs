
const { Client } = require("ssh2");
const fs = require("fs");
const conn = new Client();
conn.on("ready", () => {
  conn.exec(`cd /www/wwwroot/whatsapp-backend && npx tsc && pm2 restart whatsapp-backend`, (err, stream) => {
    if (err) throw err;
    let dataOut = "";
    stream.on("close", () => { console.log(dataOut); conn.end(); })
          .on("data", data => { dataOut += data; }).stderr.on("data", data => { dataOut += data; });
  });
}).connect({ host: "89.116.32.98", port: 22, username: "root", password: "CabNet@2025#" });


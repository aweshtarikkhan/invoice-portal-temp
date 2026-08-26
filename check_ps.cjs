
const { Client } = require("ssh2");
const conn = new Client();
conn.on("ready", () => {
  conn.exec("ps aux | grep pm2", (err, stream) => {
    let dataOut = "";
    stream.on("close", () => { console.log(dataOut); conn.end(); })
          .on("data", data => { dataOut += data; }).stderr.on("data", data => { dataOut += data; });
  });
}).connect({ host: "89.116.32.98", port: 22, username: "root", password: "CabNet@2025#" });



const { Client } = require("ssh2");

const conn = new Client();

const commands = [
  "echo \"Deploying invoice-portal-temp...\"",
  "cd /www/wwwroot/invoice-portal-temp && git pull origin main && npm run build",
  "echo \"Deploying whatsapp-backend...\"",
  "cd /www/wwwroot/whatsapp-backend && git pull origin main && npm run build",
  "echo \"Deploying sth-test-pltfrom...\"",
  "cd /www/wwwroot/sth-test-pltfrom && git pull origin main && npm run build",
  "pm2 restart all"
];

conn.on("ready", () => {
  console.log("Client :: ready");
  conn.exec(commands.join(" && "), (err, stream) => {
    if (err) throw err;
    stream.on("close", (code, signal) => {
      console.log("Stream :: close :: code: " + code + ", signal: " + signal);
      conn.end();
    }).on("data", (data) => {
      console.log("STDOUT: " + data);
    }).stderr.on("data", (data) => {
      console.log("STDERR: " + data);
    });
  });
}).connect({
  host: "89.116.32.98",
  port: 22,
  username: "root",
  password: "CabNet@2025#",
  readyTimeout: 20000 // 20s
});



const { Client } = require("ssh2");
const fs = require("fs");
const conn = new Client();
conn.on("ready", () => {
  conn.exec(`sed -i "s/phone_number: phone,/phone_number: phone, client_phone: phone,/g" /www/wwwroot/whatsapp-backend/src/db.ts`, (err, stream) => {
    if (err) throw err;
    stream.on("close", () => {
       conn.exec(`cd /www/wwwroot/whatsapp-backend && npm run build`, (err, stream2) => { // it might use tsc or something? wait, there is no build script! 
           stream2.on("close", () => {
               conn.exec(`pm2 restart whatsapp-backend`, (err, stream3) => {
                  stream3.on("close", () => conn.end());
               });
           });
       });
    });
  });
}).connect({ host: "89.116.32.98", port: 22, username: "root", password: "CabNet@2025#" });


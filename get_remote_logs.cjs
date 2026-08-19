const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('pm2 logs whatsapp-backend --lines 50 --nostream', (err, stream) => {
    stream.on('close', () => {
      conn.end();
    }).on('data', data => {
      console.log(data.toString());
    }).stderr.on('data', data => {
      console.error(data.toString());
    });
  });
}).connect({
  host: '89.116.32.98',
  port: 22,
  username: 'root',
  password: 'CabNet@2025#'
});

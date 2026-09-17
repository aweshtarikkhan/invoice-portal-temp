const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`psql "postgresql://sidb:KTcGH5JLK7APcSRX@127.0.0.1:5432/sidb?schema=public" -c "SELECT 1;"`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => console.log(d.toString()))
          .stderr.on('data', d => console.error('ERR:', d.toString()))
          .on('close', () => conn.end());
  });
}).connect({
  host: '89.116.32.98',
  port: 22,
  username: 'root',
  password: 'CabNet@2025#',
  readyTimeout: 60000
});

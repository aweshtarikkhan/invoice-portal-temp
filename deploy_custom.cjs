const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`
    echo "=== Deploying Billflow Pro (invoice-portal-temp) ==="
    cd /www/wwwroot/invoice-portal-temp && git pull && npm run build
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '89.116.32.98',
  port: 22,
  username: 'root',
  password: 'CabNet@2025#',
  readyTimeout: 60000
});

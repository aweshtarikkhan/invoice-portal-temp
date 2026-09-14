const { Client } = require('ssh2');

const conn = new Client();

const COMMANDS = [
  'cd /www/wwwroot/invoice-portal-temp && git reset --hard && git pull origin main && npm install && npm run build'
].join(' && ');

conn.on('ready', () => {
  console.log('SSH connected. Running deploy...');
  conn.exec(COMMANDS, (err, stream) => {
    if (err) { console.error('Exec error:', err); conn.end(); return; }
    stream.on('close', (code) => {
      console.log('Deploy finished with code:', code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '89.116.32.98',
  port: 22,
  username: 'root',
  password: 'CabNet@2025#'
});

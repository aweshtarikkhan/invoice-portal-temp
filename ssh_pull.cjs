const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const cmd = `
    echo "Deploying invoice-portal-temp..."
    cd /www/wwwroot/invoice-portal-temp
    git pull
    npm run build

    echo "Deploying attendance_portal..."
    cd /www/wwwroot/attendance_portal
    git pull
    npm run build

    echo "Deploying whatsapp-backend..."
    cd /www/wwwroot/whatsapp-backend
    git pull
    npm run build
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
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

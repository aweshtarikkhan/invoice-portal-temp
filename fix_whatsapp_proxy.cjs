const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const cmd = `
    sed -i '/location \\/ {/i \\    location /whatsapp-api/ {\\n        proxy_pass http://127.0.0.1:3010/api/;\\n        proxy_set_header Host $host;\\n        proxy_set_header X-Real-IP $remote_addr;\\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\\n        proxy_set_header X-Forwarded-Proto $scheme;\\n    }\\n' /www/server/panel/vhost/nginx/satahinvoice.com.conf
    nginx -s reload
    sed -i 's|VITE_WHATSAPP_SERVICE_URL=.*|VITE_WHATSAPP_SERVICE_URL=https://satahinvoice.com/whatsapp-api|g' /www/wwwroot/invoice-portal-temp/.env
    cd /www/wwwroot/invoice-portal-temp
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

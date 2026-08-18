const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // Read server.ts
    const serverPath = '/www/wwwroot/whatsapp-backend/src/server.ts';
    sftp.readFile(serverPath, 'utf8', (err, serverData) => {
      if (err) throw err;
      
      if (!serverData.includes('/api/logout')) {
        const logoutEndpoint = `
app.post('/api/logout', (req, res) => {
    const { logoutAndReset } = require('./baileys');
    logoutAndReset();
    res.json({ success: true, message: 'Reset initiated' });
});

`;
        const modifiedServer = serverData.replace('const PORT', logoutEndpoint + 'const PORT');
        sftp.writeFile(serverPath, modifiedServer, (err) => {
          if (err) throw err;
          console.log('server.ts patched');
        });
      } else {
        console.log('server.ts already patched');
      }
    });

    // Read baileys.ts
    const baileysPath = '/www/wwwroot/whatsapp-backend/src/baileys.ts';
    sftp.readFile(baileysPath, 'utf8', (err, baileysData) => {
      if (err) throw err;
      
      if (!baileysData.includes('logoutAndReset')) {
        const logoutFunc = `
export async function logoutAndReset() {
    console.log("Forcing logout and reset");
    if (sock) {
        try { await sock.logout(); } catch(e){}
        sock = null;
    }
    const fs = require('fs');
    try {
        fs.rmSync('auth_info_baileys', { recursive: true, force: true });
    } catch(e) {}
    connectionStatus = 'connecting';
    currentQR = null;
    setTimeout(() => {
        connectToWhatsApp();
    }, 1000);
}
`;
        const modifiedBaileys = baileysData + logoutFunc;
        sftp.writeFile(baileysPath, modifiedBaileys, (err) => {
          if (err) throw err;
          console.log('baileys.ts patched');
          
          // Now execute pm2 restart
          conn.exec('pm2 restart whatsapp-backend', (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
              console.log('PM2 restart finished with code ' + code);
              conn.end();
            }).on('data', (data) => {
              console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
              console.log('STDERR: ' + data);
            });
          });
        });
      } else {
        console.log('baileys.ts already patched');
        conn.exec('pm2 restart whatsapp-backend', (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
              console.log('PM2 restart finished with code ' + code);
              conn.end();
            }).on('data', (data) => {
              console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
              console.log('STDERR: ' + data);
            });
          });
      }
    });
  });
}).connect({
  host: '89.116.32.98',
  port: 22,
  username: 'root',
  password: 'CabNet@2025#'
});

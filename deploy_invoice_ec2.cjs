const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('ssh2');

const privateKey = fs.readFileSync('C:\\Users\\awesh\\.ssh\\aassaybiz-key.pem', 'utf8');
const localTar = path.join(__dirname, 'dist_aassaybiz.tar.gz');
const remoteTar = '/home/ubuntu/dist_aassaybiz.tar.gz';

console.log('Archiving fresh dist folder to dist_aassaybiz.tar.gz...');
execSync('tar -czvf dist_aassaybiz.tar.gz -C dist .', { stdio: 'inherit', cwd: __dirname });
console.log('Archive created successfully.');

const conn = new Client();

console.log('Connecting to AWS EC2 (13.234.167.71)...');

conn.on('ready', () => {
  console.log('SSH connection established. Opening SFTP session...');
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    console.log(`Uploading ${localTar} to ${remoteTar}...`);
    sftp.fastPut(localTar, remoteTar, (uploadErr) => {
      if (uploadErr) {
        console.error('Upload error:', uploadErr);
        conn.end();
        return;
      }
      console.log('Upload complete. Extracting and deploying to /var/www/aassaybiz/dist/...');

      const cmd = `
        sudo mkdir -p /var/www/aassaybiz/dist &&
        sudo tar -xzvf /home/ubuntu/dist_aassaybiz.tar.gz -C /var/www/aassaybiz/dist/ &&
        sudo chown -R www-data:www-data /var/www/aassaybiz/dist/ &&
        sudo chmod -R 755 /var/www/aassaybiz/dist/ &&
        sudo systemctl reload nginx &&
        echo "=== INVOICE PORTAL DEPLOYMENT SUCCESSFUL ===" &&
        ls -lh /var/www/aassaybiz/dist/index.html
      `;

      conn.exec(cmd, (execErr, stream) => {
        if (execErr) {
          console.error('Exec error:', execErr);
          conn.end();
          return;
        }

        stream.on('close', (code, signal) => {
          console.log(`Command closed with code ${code}`);
          conn.end();
        });

        stream.on('data', (data) => {
          process.stdout.write(data.toString());
        });

        stream.stderr.on('data', (data) => {
          process.stderr.write(data.toString());
        });
      });
    });
  });
});

conn.on('error', (err) => {
  console.error('SSH error:', err);
});

conn.connect({
  host: '13.234.167.71',
  port: 22,
  username: 'ubuntu',
  privateKey: privateKey,
  readyTimeout: 30000,
});

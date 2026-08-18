const { Client } = require('ssh2');

const baileysCode = `
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, isJidGroup, isJidStatusBroadcast, isJidNewsletter } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { upsertChat, insertMessage } from './db';
import fs from 'fs';

const logger = pino({ level: 'silent' });

export interface Session {
    sock: ReturnType<typeof makeWASocket> | null;
    currentQR: string | null;
    connectionStatus: 'connecting' | 'open' | 'close';
    lidToPhone: Map<string, string>;
}

const sessions = new Map<string, Session>();

export function getSession(org_id: string): Session {
    let session = sessions.get(org_id);
    if (!session) {
        session = {
            sock: null,
            currentQR: null,
            connectionStatus: 'close',
            lidToPhone: new Map()
        };
        sessions.set(org_id, session);
    }
    return session;
}

export async function connectToWhatsApp(org_id: string) {
    if (!org_id) return;
    
    const session = getSession(org_id);
    if (session.connectionStatus === 'open' || session.connectionStatus === 'connecting') return;

    session.connectionStatus = 'connecting';
    
    const authFolder = \`auth_info_baileys_\${org_id}\`;
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: state,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
    });

    session.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            session.currentQR = qr;
        }

        if (connection === 'close') {
            session.connectionStatus = 'close';
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(\`[\${org_id}] connection closed due to \`, lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(org_id), 3000);
            } else {
                console.log(\`[\${org_id}] Logged out.\`);
                session.currentQR = null;
                session.sock = null;
            }
        } else if (connection === 'open') {
            console.log(\`[\${org_id}] opened connection\`);
            session.connectionStatus = 'open';
            session.currentQR = null;
        } else if (connection === 'connecting') {
            session.connectionStatus = 'connecting';
        }
    });

    sock.ev.on('contacts.upsert', (contacts) => {
        for (const contact of contacts) {
            if (contact.id && contact.lid) {
                const phone = contact.id.split('@')[0];
                const lid = contact.lid.split('@')[0];
                session.lidToPhone.set(lid, phone);
            }
        }
    });

    sock.ev.on('contacts.update', (contacts) => {
        for (const contact of contacts) {
            if (contact.id && (contact as any).lid) {
                const phone = contact.id.split('@')[0];
                const lid = (contact as any).lid.split('@')[0];
                session.lidToPhone.set(lid, phone);
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
            if (!msg.message) continue;
            
            const jid = msg.key.remoteJid;
            if (!jid || isJidGroup(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid)) continue;

            const fromMe = msg.key.fromMe;
            let phone: string;

            if (jid.endsWith('@lid')) {
                if (fromMe) continue;
                
                const lidNumber = jid.split('@')[0];
                const resolved = session.lidToPhone.get(lidNumber);
                const altJid = (msg.key as any).remoteJidAlt;
                
                if (resolved) {
                    phone = resolved;
                } else if (altJid && altJid.includes('@s.whatsapp.net')) {
                    phone = altJid.split('@')[0];
                    session.lidToPhone.set(lidNumber, phone);
                } else {
                    const participant = msg.key.participant;
                    if (participant && participant.includes('@s.whatsapp.net')) {
                        phone = participant.split('@')[0];
                        session.lidToPhone.set(lidNumber, phone);
                    } else {
                        phone = lidNumber;
                    }
                }
            } else {
                phone = jid.split('@')[0];
            }

            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const msgId = msg.key.id || '';
            const contactName = msg.pushName || undefined;

            if (text) {
                const direction = fromMe ? 'outgoing' : 'incoming';
                console.log(\`[\${org_id}][\${direction}] \${phone}: \${text}\`);

                const chatId = await upsertChat(phone, text, org_id, contactName);
                if (chatId) {
                    await insertMessage(chatId, phone, direction, text, msgId, org_id);
                }
            }
        }
    });
}

export function getSocket(org_id: string) {
    return getSession(org_id).sock;
}

export function getStatus(org_id: string) {
    if (!org_id) return { status: 'close', qr: null };
    const session = getSession(org_id);
    return {
        status: session.connectionStatus,
        qr: session.currentQR
    };
}

export function registerLidMapping(org_id: string, lid: string, phone: string) {
    const session = getSession(org_id);
    session.lidToPhone.set(lid, phone);
}

export async function logoutAndReset(org_id: string) {
    console.log(\`[\${org_id}] Forcing logout and reset\`);
    const session = getSession(org_id);
    if (session.sock) {
        try { await session.sock.logout(); } catch(e){}
        session.sock = null;
    }
    try {
        fs.rmSync(\`auth_info_baileys_\${org_id}\`, { recursive: true, force: true });
    } catch(e) {}
    session.connectionStatus = 'connecting';
    session.currentQR = null;
    setTimeout(() => {
        connectToWhatsApp(org_id);
    }, 1000);
}

export function initExistingSessions() {
    try {
        const dirs = fs.readdirSync(process.cwd());
        const authDirs = dirs.filter(d => d.startsWith('auth_info_baileys_'));
        for (const dir of authDirs) {
            const org_id = dir.replace('auth_info_baileys_', '');
            if (org_id) {
                connectToWhatsApp(org_id);
            }
        }
    } catch (e) {
        console.error("Error initializing sessions", e);
    }
}
`;

const serverCode = `
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import qrcode from 'qrcode';
import { connectToWhatsApp, getSocket, getStatus, logoutAndReset, initExistingSessions } from './baileys';
import { upsertChat, insertMessage } from './db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Start existing WhatsApp sessions on boot
initExistingSessions();

app.get('/api/status', (req, res) => {
    const org_id = req.query.org_id as string;
    if (!org_id) return res.status(400).json({ error: 'org_id is required' });
    res.json(getStatus(org_id));
});

app.get('/api/qr', async (req, res) => {
    const org_id = req.query.org_id as string;
    if (!org_id) return res.status(400).json({ error: 'org_id is required' });
    
    // Auto-initialize connection if it doesn't exist
    const currentStatus = getStatus(org_id);
    if (currentStatus.status === 'close') {
        connectToWhatsApp(org_id);
    }

    const status = getStatus(org_id);
    if (status.status === 'open') {
        return res.json({ status: 'connected' });
    }
    if (status.qr) {
        try {
            const dataUrl = await qrcode.toDataURL(status.qr);
            return res.json({ status: 'qr', qr: dataUrl, raw: status.qr });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to generate QR' });
        }
    }
    res.json({ status: status.status });
});

app.post('/api/message/send', async (req, res) => {
    const { phone, text, org_id } = req.body;
    
    if (!phone || !text || !org_id) {
        return res.status(400).json({ error: 'Phone, text, and org_id are required' });
    }

    const sock = getSocket(org_id);
    const status = getStatus(org_id);

    if (!sock || status.status !== 'open') {
        return res.status(503).json({ error: 'WhatsApp is not connected for this organization' });
    }

    const cleanPhone = phone.replace(/\\D/g, '');
    const jid = \`\${cleanPhone}@s.whatsapp.net\`;

    try {
        const result = await sock.onWhatsApp(jid);
        if (!result || !result[0]?.exists) {
            return res.status(400).json({ error: 'Phone number not registered on WhatsApp' });
        }

        const sentMsg = await sock.sendMessage(jid, { text });
        
        // Register LID mapping if available
        const { registerLidMapping } = await import('./baileys');
        if (sentMsg?.key?.remoteJid && sentMsg.key.remoteJid.endsWith('@lid')) {
            const lid = sentMsg.key.remoteJid.split('@')[0];
            registerLidMapping(org_id, lid, cleanPhone);
        }

        // Save to DB
        const msgId = sentMsg?.key.id || '';
        const chatId = await upsertChat(cleanPhone, text, org_id);
        if (chatId) {
            await insertMessage(chatId, cleanPhone, 'outgoing', text, msgId, org_id);
        }

        return res.json({ success: true, messageId: msgId });
    } catch (e: any) {
        console.error("Error sending message:", e);
        return res.status(500).json({ error: e.message || 'Failed to send message' });
    }
});

app.post('/api/logout', async (req, res) => {
    const { org_id } = req.body;
    if (!org_id) return res.status(400).json({ error: 'org_id is required' });
    
    await logoutAndReset(org_id);
    res.json({ success: true, message: 'Reset initiated' });
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
    console.log(\`WhatsApp Service running on port \${PORT}\`);
});
`;

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // Write baileys.ts
    sftp.writeFile('/www/wwwroot/whatsapp-backend/src/baileys.ts', baileysCode, (err) => {
      if (err) throw err;
      console.log('baileys.ts written');
      
      // Write server.ts
      sftp.writeFile('/www/wwwroot/whatsapp-backend/src/server.ts', serverCode, (err) => {
        if (err) throw err;
        console.log('server.ts written');
        
        // Execute compilation and PM2 restart
        conn.exec('cd /www/wwwroot/whatsapp-backend && rm -rf dist && npx tsc && pm2 restart whatsapp-backend', (err, stream) => {
          if (err) throw err;
          stream.on('close', (code, signal) => {
            console.log('Compilation and PM2 restart finished with code ' + code);
            conn.end();
          }).on('data', (data) => {
            console.log('STDOUT: ' + data);
          }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
          });
        });
      });
    });
  });
}).connect({
  host: '89.116.32.98',
  port: 22,
  username: 'root',
  password: 'CabNet@2025#'
});

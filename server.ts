import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import qrcode from 'qrcode';
import { connectToWhatsApp, getSession, disconnectWhatsApp } from './baileys';
import { upsertChat, insertMessage } from './db';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Optionally restore sessions on boot if you scan the directory for auth_info_baileys_*
const rootDir = process.cwd();
const files = fs.readdirSync(rootDir);
files.forEach(file => {
    if (file.startsWith('auth_info_baileys_')) {
        const orgId = file.replace('auth_info_baileys_', '');
        connectToWhatsApp(orgId);
    }
});

app.get('/api/status', (req, res) => {
    const orgId = req.query.org_id as string;
    if (!orgId) return res.status(400).json({ error: 'org_id is required' });
    
    const session = getSession(orgId);
    if (!session) {
        return res.json({ status: 'close', qr: null });
    }
    res.json({ status: session.connectionStatus, qr: session.currentQR });
});

app.get('/api/qr', async (req, res) => {
    const orgId = req.query.org_id as string;
    if (!orgId) return res.status(400).json({ error: 'org_id is required' });

    let session = getSession(orgId);
    if (!session || session.connectionStatus === 'close') {
        session = await connectToWhatsApp(orgId);
    }

    if (session.connectionStatus === 'open') {
        return res.json({ status: 'connected' });
    }
    
    if (session.currentQR) {
        try {
            const dataUrl = await qrcode.toDataURL(session.currentQR);
            return res.json({ status: 'qr', qr: dataUrl, raw: session.currentQR });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to generate QR' });
        }
    }
    res.json({ status: session.connectionStatus });
});

app.post('/api/logout', async (req, res) => {
    const { org_id } = req.body;
    if (!org_id) return res.status(400).json({ error: 'org_id is required' });
    
    await disconnectWhatsApp(org_id);
    return res.json({ success: true, message: 'Logged out successfully' });
});

import crypto from 'crypto';

interface QueuedMessage {
    jid: string;
    text: string;
    org_id: string;
    cleanPhone: string;
    mediaUrl?: string;
    msgId: string;
    chatId: string;
}

const sendQueue: QueuedMessage[] = [];
let isQueueRunning = false;

async function processQueue() {
    if (isQueueRunning) return;
    isQueueRunning = true;
    while (sendQueue.length > 0) {
        const msg = sendQueue.shift();
        if (msg) {
            try {
                const session = getSession(msg.org_id);
                if (session && session.sock && session.connectionStatus === 'open') {
                    const result = await session.sock.onWhatsApp(msg.jid);
                    if (result && result[0]?.exists) {
                        let sentMsg;
                        if (msg.mediaUrl) {
                            sentMsg = await session.sock.sendMessage(msg.jid, { 
                                image: { url: msg.mediaUrl }, 
                                caption: msg.text 
                            });
                        } else {
                            sentMsg = await session.sock.sendMessage(msg.jid, { text: msg.text });
                        }
                        
                        const { registerLidMapping } = await import('./baileys');
                        if (sentMsg?.key?.remoteJid && sentMsg.key.remoteJid.endsWith('@lid')) {
                            const lid = sentMsg.key.remoteJid.split('@')[0];
                            registerLidMapping(msg.org_id, lid, msg.cleanPhone);
                        }

                        // We already saved the message immediately, but we could update its status here if needed.
                        // For now, it's already in DB as 'sent' or 'sending'.
                    }
                }
            } catch (e) {
                console.error("Queue send error:", e);
            }
            if (sendQueue.length > 0) {
                // Wait 60 seconds before sending the next one
                await new Promise(r => setTimeout(r, 60000));
            }
        }
    }
    isQueueRunning = false;
}

app.post('/api/message/send', async (req, res) => {
    const { phone, text, org_id, mediaUrl } = req.body;
    
    if (!phone || !text || !org_id) {
        return res.status(400).json({ error: 'Phone, text, and org_id are required' });
    }

    const session = getSession(org_id);

    if (!session || !session.sock || session.connectionStatus !== 'open') {
        return res.status(503).json({ error: 'WhatsApp is not connected' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;

    try {
        // Save to DB immediately with a generated ID so UI sees it instantly
        const msgId = crypto.randomUUID();
        const chatId = await upsertChat(cleanPhone, text, org_id);
        if (chatId) {
            await insertMessage(chatId, cleanPhone, 'outgoing', text, msgId, org_id);
        }

        // Put in queue
        sendQueue.push({ jid, text, org_id, cleanPhone, mediaUrl, msgId, chatId: chatId || '' });
        processQueue(); // start if not running

        return res.json({ success: true, messageId: msgId, queued: true });
    } catch (e: any) {
        console.error("Error queueing message:", e);
        return res.status(500).json({ error: e.message || 'Failed to queue message' });
    }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
    console.log(`WhatsApp Service running on port ${PORT}`);
});

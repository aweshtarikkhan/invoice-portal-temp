const fs = require('fs');

let content = fs.readFileSync('src/components/settings/WhatsAppSettingsTab.tsx', 'utf8');

const oldButtonCondition = `          {/* Action Button */}
          {(connectionStatus === 'connected' || connectionStatus === 'open' || connectionStatus === 'qr' || connectionStatus === 'close' || connectionStatus === 'disconnected') && (
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={loading} className="gap-2 shrink-0 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">`;

const newButtonCondition = `          {/* Action Button */}
          {true && (
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={loading} className="gap-2 shrink-0 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">`;

content = content.replace(oldButtonCondition, newButtonCondition);

fs.writeFileSync('src/components/settings/WhatsAppSettingsTab.tsx', content, 'utf8');
console.log('patched whatsapp settings');

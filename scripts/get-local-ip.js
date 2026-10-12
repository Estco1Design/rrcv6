#!/usr/bin/env node

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.internal || iface.family !== 'IPv4') {
        continue;
      }
      
      // Return the first non-internal IPv4 address
      return iface.address;
    }
  }
  
  return null;
}

const localIP = getLocalIP();

if (localIP) {
  console.log('\n========================================');
  console.log('  RRC DEV SERVER - LAN ACCESS');
  console.log('========================================\n');
  console.log(`  Local IP: ${localIP}`);
  console.log(`  URL:      http://${localIP}:3000`);
  console.log('\n  Откройте этот адрес на телефоне.');
  console.log('  Убедитесь, что телефон и компьютер в одной Wi-Fi сети.\n');
  console.log('========================================\n');
} else {
  console.log('\n⚠️  Не удалось определить локальный IP-адрес.');
  console.log('  Проверьте сетевые подключения.\n');
}

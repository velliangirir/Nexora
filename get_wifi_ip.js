const os = require('os');
const { execSync } = require('child_process');

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ interface: name, ip: iface.address });
      }
    }
  }

  return addresses;
}

const ips = getLocalIPv4();
console.log('\n=======================================================');
console.log('📱 DIRECT NORMAL MOBILE INSTALLATION LINK');
console.log('=======================================================');

if (ips.length === 0) {
  console.log('⚠️ Could not find an active local Wi-Fi / LAN IP address.');
  console.log('Ensure your PC is connected to Wi-Fi or Hotspot.');
} else {
  const primaryIp = ips[0].ip;
  const normalUrl = `http://${primaryIp}:5173`;

  console.log('\n🔗 YOUR NORMAL INSTALL LINK:');
  console.log(`\n   👉 ${normalUrl}\n`);
  console.log('=======================================================');
  console.log('📲 HOW TO OPEN & INSTALL ON PHONE:');
  console.log(`1. Open Chrome or Safari on your phone.`);
  console.log(`2. Type or paste this exact link: ${normalUrl}`);
  console.log(`3. Tap menu -> "Add to Home screen" or "Install App".`);
  console.log('=======================================================\n');

  try {
    console.log('📷 MEDIUM QR CODE FOR MOBILE SCANNING:');
    execSync(`npx -y qrcode-terminal "${normalUrl}" --small`, { stdio: 'inherit' });
  } catch (err) {
    // If QR code generation fails, keep simple text link
  }
}


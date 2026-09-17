import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// NEXORA AI Aesthetic Logo Image URL
const logoUrl = 'https://i.pinimg.com/736x/1f/93/1c/1f931c2daa48fcd08c5c4c1332687ce1.jpg';

console.log('Fetching original NEXORA AI logo for mobile PWA icons...');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download logo, status: ${res.statusCode}`));
      }
    }).on('error', (err) => reject(err));
  });
}

async function main() {
  try {
    const tempLogo = path.join(publicDir, 'logo.jpg');
    await download(logoUrl, tempLogo);
    console.log('✅ Logo image downloaded successfully.');

    // Copy to PNG icon targets so browsers accept them for PWA & Apple Touch Icons
    const icon192 = path.join(publicDir, 'icon-192.png');
    const icon512 = path.join(publicDir, 'icon-512.png');
    const appleTouchIcon = path.join(publicDir, 'apple-touch-icon.png');
    const faviconPng = path.join(publicDir, 'favicon.png');

    fs.copyFileSync(tempLogo, icon192);
    fs.copyFileSync(tempLogo, icon512);
    fs.copyFileSync(tempLogo, appleTouchIcon);
    fs.copyFileSync(tempLogo, faviconPng);

    console.log('✅ Generated PNG PWA Icons: icon-192.png, icon-512.png, apple-touch-icon.png, favicon.png');
  } catch (err) {
    console.error('Error generating icons:', err.message);
  }
}

main();

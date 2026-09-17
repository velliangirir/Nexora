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

const imageUrl = 'https://i.pinimg.com/736x/1f/93/1c/1f931c2daa48fcd08c5c4c1332687ce1.jpg';
const targetPath = path.join(publicDir, 'logo.jpg');

console.log('Downloading Pinterest logo image from:', imageUrl);

https.get(imageUrl, (res) => {
  if (res.statusCode === 200) {
    const fileStream = fs.createWriteStream(targetPath);
    res.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log('✅ Pinterest logo image saved successfully to:', targetPath);
    });
  } else {
    console.error('Failed to download image, status code:', res.statusCode);
  }
}).on('error', (err) => {
  console.error('Error downloading image:', err.message);
});

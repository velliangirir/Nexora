import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Circular LS Monogram SVG Icon
const lsMonogramSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <circle cx="256" cy="256" r="240" fill="url(#ls_grad_bg)" stroke="url(#ls_grad_stroke)" stroke-width="16" />
  <circle cx="256" cy="256" r="216" stroke="rgba(255,255,255,0.15)" stroke-width="4" stroke-dasharray="12 8" />
  <path d="M170 140V330C170 352 188 370 210 370H320" stroke="white" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M340 180C340 155 315 135 285 135H235C205 135 180 155 180 180C180 210 205 230 240 240L280 250C320 260 345 280 345 315C345 345 315 370 280 370H225C190 370 165 345 165 320" stroke="url(#ls_s_grad)" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M370 110L380 140L410 150L380 160L370 190L360 160L330 150L360 140L370 110Z" fill="#38BDF8" />
  <defs>
    <linearGradient id="ls_grad_bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B132B" />
      <stop offset="1" stop-color="#1C2541" />
    </linearGradient>
    <linearGradient id="ls_grad_stroke" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8" />
      <stop offset="1" stop-color="#6366F1" />
    </linearGradient>
    <linearGradient id="ls_s_grad" x1="165" y1="135" x2="345" y2="370" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8" />
      <stop offset="0.5" stop-color="#818CF8" />
      <stop offset="1" stop-color="#C084FC" />
    </linearGradient>
  </defs>
</svg>`;

// Maskable Full-Bleed Version
const lsMaskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#090D16" />
  <circle cx="256" cy="256" r="210" fill="url(#ls_grad_bg)" stroke="url(#ls_grad_stroke)" stroke-width="14" />
  <path d="M170 140V330C170 352 188 370 210 370H320" stroke="white" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M340 180C340 155 315 135 285 135H235C205 135 180 155 180 180C180 210 205 230 240 240L280 250C320 260 345 280 345 315C345 345 315 370 280 370H225C190 370 165 345 165 320" stroke="url(#ls_s_grad)" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M370 110L380 140L410 150L380 160L370 190L360 160L330 150L360 140L370 110Z" fill="#38BDF8" />
  <defs>
    <linearGradient id="ls_grad_bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B132B" />
      <stop offset="1" stop-color="#1C2541" />
    </linearGradient>
    <linearGradient id="ls_grad_stroke" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8" />
      <stop offset="1" stop-color="#6366F1" />
    </linearGradient>
    <linearGradient id="ls_s_grad" x1="165" y1="135" x2="345" y2="370" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38BDF8" />
      <stop offset="0.5" stop-color="#818CF8" />
      <stop offset="1" stop-color="#C084FC" />
    </linearGradient>
  </defs>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), lsMonogramSvg);
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), lsMonogramSvg);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), lsMonogramSvg);
fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), lsMaskableSvg);

console.log('✅ LS Monogram PWA Icon assets generated successfully!');

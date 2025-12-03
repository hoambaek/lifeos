import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#0a0a0b"/>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#c8ff00"/>
      <stop offset="100%" style="stop-color:#00d4ff"/>
    </linearGradient>
  </defs>
  <g transform="translate(256, 256)">
    <rect x="-180" y="-60" width="50" height="120" rx="10" fill="url(#gradient)"/>
    <rect x="-150" y="-40" width="30" height="80" rx="5" fill="url(#gradient)"/>
    <rect x="-120" y="-15" width="240" height="30" rx="8" fill="url(#gradient)"/>
    <rect x="120" y="-40" width="30" height="80" rx="5" fill="url(#gradient)"/>
    <rect x="130" y="-60" width="50" height="120" rx="10" fill="url(#gradient)"/>
  </g>
  <text x="256" y="420" text-anchor="middle" font-family="system-ui, sans-serif" font-size="80" font-weight="bold" fill="#c8ff00">6M</text>
</svg>`;

async function generateIcons() {
  const outputDir = join(__dirname, '../public/icons');

  try {
    await mkdir(outputDir, { recursive: true });
  } catch (e) {
    // Directory exists
  }

  const svgBuffer = Buffer.from(svgContent);

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(outputDir, `icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Generate apple-touch-icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(__dirname, '../public/apple-touch-icon.png'));

  console.log('Generated apple-touch-icon.png');

  // Generate favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(__dirname, '../public/favicon.png'));

  console.log('Generated favicon.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);

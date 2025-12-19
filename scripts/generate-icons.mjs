import sharp from 'sharp';
import { mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const outputDir = join(__dirname, '../public/icons');
  const svgPath = join(outputDir, 'icon.svg');

  try {
    await mkdir(outputDir, { recursive: true });
  } catch (e) {
    // Directory exists
  }

  // Read SVG from file
  const svgContent = await readFile(svgPath, 'utf-8');
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

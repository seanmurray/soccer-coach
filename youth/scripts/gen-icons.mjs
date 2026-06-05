// Generate PWA raster icons from public/favicon.svg.
// Run from the parent app dir (which has `sharp`): `node youth/scripts/gen-icons.mjs`.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');

const SVG = await readFile(path.join(PUBLIC, 'favicon.svg'));

const TARGETS = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of TARGETS) {
  const buf = await sharp(SVG).resize(size, size).png().toBuffer();
  await writeFile(path.join(PUBLIC, name), buf);
  console.log(`wrote public/${name} (${size}x${size})`);
}

// Generate PWA raster icons + per-athlete favicons.
//
// Output: youth/public/favicon-{athlete}.svg + icons in
// youth/public/icons/{athlete}/{icon-192,icon-512,apple-touch-icon}.png
//
// At build time, the CI workflow copies the right per-athlete asset set into
// the build's public/ before `npm run build`, so each athlete's PWA ships
// with its own icon files.
//
// Run from the parent app dir (which has `sharp`):
//   node youth/scripts/gen-icons.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');

// Each athlete: bg gradient (dark → darker), bolt gradient (primary → accent),
// and a stroke color that contrasts the bolt.
const PALETTES = {
  seamus: {
    bgFrom:  '#13203a', bgTo:  '#0b1220',
    boltFrom:'#3a8dff', boltTo:'#32d977',
    stroke:  '#06210f',
  },
  millie: {
    bgFrom:  '#2d1525', bgTo:  '#170a13',
    boltFrom:'#ff4d9d', boltTo:'#ffafd0',
    stroke:  '#2a0a18',
  },
  evie: {
    bgFrom:  '#241a3c', bgTo:  '#110b20',
    boltFrom:'#b974ff', boltTo:'#d68aff',
    stroke:  '#1c0e2e',
  },
};

const TARGETS = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

function svgFor(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.bgFrom}"/>
      <stop offset="1" stop-color="${p.bgTo}"/>
    </linearGradient>
    <linearGradient id="bolt" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.boltFrom}"/>
      <stop offset="1" stop-color="${p.boltTo}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <path d="M296 64 L150 296 H242 L216 448 L372 216 H278 Z"
        fill="url(#bolt)" stroke="${p.stroke}" stroke-width="10" stroke-linejoin="round"/>
</svg>
`;
}

for (const [athlete, palette] of Object.entries(PALETTES)) {
  const svg = svgFor(palette);

  // Per-athlete SVG (used as favicon source + checked into the repo for review).
  await writeFile(path.join(PUBLIC, `favicon-${athlete}.svg`), svg);

  const outDir = path.join(PUBLIC, 'icons', athlete);
  await mkdir(outDir, { recursive: true });
  for (const { name, size } of TARGETS) {
    const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
    await writeFile(path.join(outDir, name), buf);
  }
  console.log(`wrote ${athlete}: favicon-${athlete}.svg + 3 PNGs in icons/${athlete}/`);
}

// Keep public/favicon.svg + icon-*.png as the Seamus defaults so `npm run dev`
// works without the per-athlete pre-build copy step.
const seamusSvg = svgFor(PALETTES.seamus);
await writeFile(path.join(PUBLIC, 'favicon.svg'), seamusSvg);
for (const { name, size } of TARGETS) {
  const buf = await sharp(Buffer.from(seamusSvg)).resize(size, size).png().toBuffer();
  await writeFile(path.join(PUBLIC, name), buf);
}
console.log('wrote default seamus assets at public/');

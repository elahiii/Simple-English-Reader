import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRC32 lookup table
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, crcBuf]);
}

function createIconPNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA color type

  // Draw a blue rounded-rect icon with a white "E" letterform
  const rows = [];
  const half = size / 2;
  const radius = size * 0.2;

  for (let y = 0; y < size; y++) {
    const row = [0]; // filter: None
    for (let x = 0; x < size; x++) {
      const dx = Math.min(x, size - 1 - x);
      const dy = Math.min(y, size - 1 - y);

      // Rounded rect alpha (anti-aliased corner)
      let alpha = 255;
      if (dx < radius && dy < radius) {
        const dist = Math.sqrt((radius - dx) ** 2 + (radius - dy) ** 2);
        alpha = dist > radius ? 0 : dist > radius - 1 ? Math.round((radius - dist) * 255) : 255;
      }

      if (alpha === 0) {
        row.push(0, 0, 0, 0);
        continue;
      }

      // Blue gradient background
      const t = y / size;
      const r = Math.round(37 + t * 30);
      const g = Math.round(99 + t * 20);
      const b = Math.round(235 - t * 20);

      // White "E" letterform (3 horizontal bars)
      const cx = x / size;
      const cy = y / size;
      const mx = 0.25, mxr = 0.78;
      const barH = 0.09;
      const bars = [
        [0.22, 0.22 + barH], // top
        [0.45, 0.45 + barH], // middle
        [0.68, 0.68 + barH], // bottom
      ];
      const midBar = bars[1];
      const isBar = bars.some(([t0, t1]) => cy >= t0 && cy <= t1 && cx >= mx && cx <= (t0 === midBar[0] ? mxr - 0.12 : mxr));
      const isLeft = cx >= mx && cx <= mx + 0.1 && cy >= 0.22 && cy <= 0.77;
      const isWhite = isBar || isLeft;

      if (isWhite) {
        row.push(255, 255, 255, alpha);
      } else {
        row.push(r, g, b, alpha);
      }
    }
    rows.push(row);
  }

  const raw = Buffer.from(rows.flat());
  const compressed = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

for (const size of sizes) {
  const buf = createIconPNG(size);
  const out = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(out, buf);
  console.log(`  ✓ icon${size}.png`);
}

console.log('Icons generated.');

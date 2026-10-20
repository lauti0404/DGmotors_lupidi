import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([len, name, data, crc]);
}

function png(size) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) set(x, y, 10, 10, 10);
  }
  const u = size / 16;
  const rect = (x, y, w, h, r, g, b) => {
    for (let yy = Math.round(y); yy < Math.round(y + h); yy += 1) {
      for (let xx = Math.round(x); xx < Math.round(x + w); xx += 1) set(xx, yy, r, g, b);
    }
  };
  rect(u, 0, u, size, 220, 38, 38);
  rect(4 * u, 4 * u, u, 8 * u, 255, 255, 255);
  rect(5 * u, 4 * u, 2 * u, u, 255, 255, 255);
  rect(5 * u, 11 * u, 2 * u, u, 255, 255, 255);
  rect(7 * u, 5 * u, u, 6 * u, 255, 255, 255);
  rect(9 * u, 4 * u, 3 * u, u, 255, 255, 255);
  rect(9 * u, 4 * u, u, 8 * u, 255, 255, 255);
  rect(9 * u, 11 * u, 3 * u, u, 255, 255, 255);
  rect(11 * u, 8 * u, u, 4 * u, 255, 255, 255);
  rect(10.2 * u, 7.2 * u, 2 * u, u, 255, 255, 255);
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const icons = join(root, "public", "icons");
mkdirSync(icons, { recursive: true });
writeFileSync(join(icons, "icon-192.png"), png(192));
writeFileSync(join(icons, "icon-512.png"), png(512));
console.log(icons);

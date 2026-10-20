import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const source = process.argv[2];
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

function decode(file) {
  const buf = readFileSync(file);
  let offset = 8;
  const parts = [];
  let width = 0;
  let height = 0;
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.slice(offset + 4, offset + 8).toString();
    const data = buf.slice(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    }
    if (type === "IDAT") parts.push(data);
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * 3;
  const out = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  };
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const row = y * stride;
    const src = y * (stride + 1) + 1;
    for (let i = 0; i < stride; i += 1) {
      const left = i >= 3 ? out[row + i - 3] : 0;
      const up = y ? out[row - stride + i] : 0;
      const ul = y && i >= 3 ? out[row - stride + i - 3] : 0;
      let value = raw[src + i];
      if (filter === 1) value = (value + left) & 255;
      else if (filter === 2) value = (value + up) & 255;
      else if (filter === 3) value = (value + ((left + up) >> 1)) & 255;
      else if (filter === 4) value = (value + paeth(left, up, ul)) & 255;
      out[row + i] = value;
    }
  }
  return { width, height, rgb: out };
}

function encode(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function cutCircle({ width, height, rgb }) {
  const rgba = Buffer.alloc(width * height * 4);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const radius = width / 2 - 2.2;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dist = Math.hypot(x - cx, y - cy);
      const fade = Math.min(1, Math.max(0, radius + 1.1 - dist));
      const i = (y * width + x) * 3;
      const j = (y * width + x) * 4;
      let red = rgb[i];
      let green = rgb[i + 1];
      let blue = rgb[i + 2];
      if (red < 45 && green < 45 && blue < 45) {
        red = 21;
        green = 21;
        blue = 21;
      }
      rgba[j] = red;
      rgba[j + 1] = green;
      rgba[j + 2] = blue;
      rgba[j + 3] = Math.round(255 * fade);
    }
  }
  return rgba;
}

function scale(src, size, background) {
  const side = Math.round(Math.sqrt(src.length / 4));
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = Math.min(side - 1, Math.floor((x / size) * side));
      const sy = Math.min(side - 1, Math.floor((y / size) * side));
      const i = (sy * side + sx) * 4;
      const j = (y * size + x) * 4;
      const alpha = src[i + 3] / 255;
      out[j] = Math.round(src[i] * alpha + background[0] * (1 - alpha));
      out[j + 1] = Math.round(src[i + 1] * alpha + background[1] * (1 - alpha));
      out[j + 2] = Math.round(src[i + 2] * alpha + background[2] * (1 - alpha));
      out[j + 3] = 255;
    }
  }
  return out;
}

const image = decode(source);
const rgba = cutCircle(image);
writeFileSync(join(root, "public", "logo.png"), encode(image.width, image.height, rgba));
writeFileSync(join(root, "public", "favicon.png"), encode(image.width, image.height, rgba));
writeFileSync(join(root, "public", "icons", "icon-192.png"), encode(192, 192, scale(rgba, 192, [21, 21, 21])));
writeFileSync(join(root, "public", "icons", "icon-512.png"), encode(512, 512, scale(rgba, 512, [21, 21, 21])));
console.log("logo listo");

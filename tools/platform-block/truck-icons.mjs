// Map truck icons for the platform screen.
// Copies the top-down truck icons from images/Truck on map/<type>/State=Default.png to
// images/platform/trucks/map/<type>.png and draws the selected state (<type>-on.png): the same truck with the
// dark outline the build's ТБО drawing gets when selected. The outline hugs the truck body only, not its soft shadow.
// Run: node tools/platform-block/truck-icons.mjs
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "images", "Truck on map");
const OUT = path.join(ROOT, "images", "platform", "trucks", "map");
const TYPES = { tbo: "Мусоровоз ТБО", bunker: "Бункеровоз", multi: "Мультилифт", samosval: "Самосвал", assen: "Ассенизатор" };
const OUTLINE = [0x24, 0x2a, 0x35], RADIUS = 1.6, BODY = 0.55; // body = alpha above 55 %; the shadow is fainter

function decode(buf) {
  let p = 8, w, h, ct, bd, idat = [], plte = null, trns = null;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; if (d[12]) { throw new Error("interlaced PNG"); } }
    else if (type === "PLTE") { plte = d; } else if (type === "tRNS") { trns = d; } else if (type === "IDAT") { idat.push(d); }
    p += 12 + len;
  }
  if (bd !== 8) { throw new Error("bit depth " + bd); }
  const ch = { 6: 4, 2: 3, 3: 1, 4: 2, 0: 1 }[ct], stride = w * ch, raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[y * stride + x - ch] : 0, b = y ? px[(y - 1) * stride + x] : 0, c = x >= ch && y ? px[(y - 1) * stride + x - ch] : 0;
      let v = row[x];
      if (f === 1) { v += a; } else if (f === 2) { v += b; } else if (f === 3) { v += (a + b) >> 1; }
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * stride + x] = v & 255;
    }
  }
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const s = px.subarray(i * ch, i * ch + ch);
    const [r, g, b, a] = ct === 6 ? s : ct === 2 ? [s[0], s[1], s[2], 255] : ct === 4 ? [s[0], s[0], s[0], s[1]] : ct === 0 ? [s[0], s[0], s[0], 255]
      : [plte[s[0] * 3], plte[s[0] * 3 + 1], plte[s[0] * 3 + 2], trns && s[0] < trns.length ? trns[s[0]] : 255];
    rgba.set([r, g, b, a], i * 4);
  }
  return { w, h, rgba };
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) { c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; } return c; });
const crc = (b) => { let c = -1; for (const x of b) { c = CRC[(c ^ x) & 255] ^ (c >>> 8); } return (c ^ -1) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4), c = Buffer.alloc(4), td = Buffer.concat([Buffer.from(t, "ascii"), d]); l.writeUInt32BE(d.length); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function encode({ w, h, rgba }) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// the selected state: an outline ring around the body, under the original pixels
function outlined(img) {
  const { w, h, rgba } = img, out = Buffer.from(rgba), R = Math.ceil(RADIUS + 1);
  const body = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rgba[(y * w + x) * 4 + 3] >= BODY * 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let d = Infinity;
      for (let dy = -R; dy <= R; dy++) { for (let dx = -R; dx <= R; dx++) { if (body(x + dx, y + dy)) { d = Math.min(d, Math.hypot(dx, dy)); } } }
      const ring = Math.max(0, Math.min(1, RADIUS + 0.5 - d)), i = (y * w + x) * 4;
      if (!ring) { continue; }
      // source over the ring: the truck stays on top, its faint shadow is replaced by the ring
      const sa = rgba[i + 3] / 255 * (body(x, y) ? 1 : 0), oa = sa + ring * (1 - sa);
      for (let k = 0; k < 3; k++) { out[i + k] = Math.round((rgba[i + k] * sa + OUTLINE[k] * ring * (1 - sa)) / oa); }
      out[i + 3] = Math.round(Math.max(oa, rgba[i + 3] / 255) * 255);
    }
  }
  return { w, h, rgba: out };
}

fs.mkdirSync(OUT, { recursive: true });
for (const [type, dir] of Object.entries(TYPES)) {
  const file = path.join(SRC, dir, "State=Default.png"), buf = fs.readFileSync(file);
  fs.writeFileSync(path.join(OUT, type + ".png"), buf);
  fs.writeFileSync(path.join(OUT, type + "-on.png"), encode(outlined(decode(buf))));
  console.log(type, "ok");
}

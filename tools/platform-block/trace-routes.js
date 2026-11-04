/* Street-following truck routes for the Platform map.
   Reads the 2GIS backdrop, classifies pixels into arterial (orange), street (bright against its surroundings) and block,
   then finds the cheapest path between consecutive stops (A*, 8-connected) and simplifies it into straight runs.
   stdin:  {"image": "<path>", "routes": {"<key>": [[x, y], ...]}}   (map pixels = backdrop pixels)
   stdout: {"<key>": [[x, y], ...]}  simplified polyline through every stop
   Needs sharp. Called by build-platform.js. */
const sharp = require('sharp');

const COST = [14, 1, 0.65]; // block, street, arterial: trucks prefer the main roads; block cost stays low enough to bridge street labels

async function roadMask(src) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H, L = new Float32Array(N), K = new Uint8Array(N);
  for (let p = 0; p < N; p++) { const i = p * 3; L[p] = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]; }
  const S = new Float64Array((W + 1) * (H + 1)); // integral image for a 15px local mean
  for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) { s += L[y * W + x]; S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + s; } }
  const R = 7;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x, i = p * 3, r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 215 && g > 120 && g < 205 && b < 130) { K[p] = 2; continue; }
    const x0 = Math.max(0, x - R), x1 = Math.min(W, x + R + 1), y0 = Math.max(0, y - R), y1 = Math.min(H, y + R + 1);
    const m = (S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0]) / ((x1 - x0) * (y1 - y0));
    if (Math.min(r, g, b) > 226 && r - b < 22 && L[p] - m > 3.5) K[p] = 1;
  }
  return { W, H, K };
}

/* Binary min-heap keyed by f */
function Heap() { this.k = []; this.v = []; }
Heap.prototype.push = function (key, val) {
  const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val);
  while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
  k[i] = key; v[i] = val;
};
Heap.prototype.pop = function () {
  const k = this.k, v = this.v, top = v[0], lk = k.pop(), lv = v.pop(), n = k.length;
  if (n) {
    let i = 0;
    for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; }
    k[i] = lk; v[i] = lv;
  }
  return top;
};

function astar(M, a, b, pad) {
  const { W, H, K } = M;
  const bx0 = Math.max(0, Math.min(a[0], b[0]) - pad), bx1 = Math.min(W - 1, Math.max(a[0], b[0]) + pad);
  const by0 = Math.max(0, Math.min(a[1], b[1]) - pad), by1 = Math.min(H - 1, Math.max(a[1], b[1]) + pad);
  const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1, g = new Float64Array(bw * bh).fill(Infinity), from = new Int32Array(bw * bh).fill(-1);
  const id = (x, y) => (y - by0) * bw + (x - bx0), hmin = COST[2];
  const h = (x, y) => Math.hypot(x - b[0], y - b[1]) * hmin;
  const s = id(a[0], a[1]), t = id(b[0], b[1]), open = new Heap();
  g[s] = 0; open.push(h(a[0], a[1]), s);
  const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  while (open.k.length) {
    const cur = open.pop(); if (cur === t) break;
    const cx = cur % bw + bx0, cy = (cur / bw | 0) + by0, gc = g[cur];
    for (const [dx, dy, dl] of D) {
      const nx = cx + dx, ny = cy + dy; if (nx < bx0 || nx > bx1 || ny < by0 || ny > by1) continue;
      const n = id(nx, ny), ng = gc + dl * COST[K[ny * W + nx]];
      if (ng < g[n]) { g[n] = ng; from[n] = cur; open.push(ng + h(nx, ny), n); }
    }
  }
  if (from[t] < 0 && s !== t) return null;
  const path = []; for (let c = t; c >= 0; c = c === s ? -1 : from[c]) path.push([c % bw + bx0, (c / bw | 0) + by0]);
  return path.reverse();
}

/* Ramer–Douglas–Peucker */
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1], len = Math.hypot(bx - ax, by - ay) || 1;
  let im = 0, dm = 0;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len; if (d > dm) { dm = d; im = i; } }
  if (dm <= eps) return [pts[0], pts[pts.length - 1]];
  return simplify(pts.slice(0, im + 1), eps).slice(0, -1).concat(simplify(pts.slice(im), eps));
}

(async () => {
  let input = ''; for await (const c of process.stdin) input += c;
  const { image, routes } = JSON.parse(input);
  const M = await roadMask(image), out = {};
  for (const [key, stops] of Object.entries(routes)) {
    const pts = stops.map(([x, y]) => [Math.round(x), Math.round(y)]);
    let line = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const seg = astar(M, pts[i], pts[i + 1], 140) || [pts[i], pts[i + 1]];
      line = line.concat(simplify(seg, 3).slice(1));
    }
    out[key] = line;
  }
  process.stdout.write(JSON.stringify(out));
})();

/**
 * Build auri-idle-blink.png from auri-idle.png.
 * Copies forehead fur over the eye sockets (keeps texture), then draws lids.
 * Body outside the eyes stays byte-identical.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const IDLE = path.join(__dirname, '..', 'assets', 'mascot', 'auri-idle.png');
const OUT = path.join(__dirname, '..', 'assets', 'mascot', 'auri-idle-blink.png');

const png = PNG.sync.read(fs.readFileSync(IDLE));
const { width: W, height: H, data } = png;
const out = Buffer.from(data);

function idx(x, y) {
  return (W * y + x) << 2;
}

function isEyeTeal(i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a < 200) return false;
  return r < 120 && g > 120 && b > 100 && g > r + 25 && b > r + 15;
}

const eyes = [];
for (let y = 195; y < 285; y++) {
  for (let x = 140; x < 370; x++) {
    if (isEyeTeal(idx(x, y))) eyes.push([x, y]);
  }
}

let c1 = 180;
let c2 = 320;
for (let it = 0; it < 14; it++) {
  let s1 = 0;
  let n1 = 0;
  let s2 = 0;
  let n2 = 0;
  for (const [x] of eyes) {
    if (Math.abs(x - c1) <= Math.abs(x - c2)) {
      s1 += x;
      n1++;
    } else {
      s2 += x;
      n2++;
    }
  }
  c1 = s1 / Math.max(1, n1);
  c2 = s2 / Math.max(1, n2);
}

function cluster(cx, other) {
  const pts = eyes.filter(([x]) => Math.abs(x - cx) <= Math.abs(x - other));
  let sx = 0;
  let sy = 0;
  let minx = 1e9;
  let maxx = 0;
  let miny = 1e9;
  let maxy = 0;
  for (const [x, y] of pts) {
    sx += x;
    sy += y;
    minx = Math.min(minx, x);
    maxx = Math.max(maxx, x);
    miny = Math.min(miny, y);
    maxy = Math.max(maxy, y);
  }
  return {
    cx: sx / pts.length,
    cy: sy / pts.length,
    minx,
    maxx,
    miny,
    maxy,
    rx: (maxx - minx) / 2 + 14,
    ry: (maxy - miny) / 2 + 16,
  };
}

const L = cluster(Math.min(c1, c2), Math.max(c1, c2));
const R = cluster(Math.max(c1, c2), Math.min(c1, c2));

function coverEye(eye) {
  // Grow a mask from teal + nearby pupil/white/outline.
  const mask = new Set();
  const queue = [];
  for (let y = Math.floor(eye.miny) - 6; y <= Math.ceil(eye.maxy) + 6; y++) {
    for (let x = Math.floor(eye.minx) - 6; x <= Math.ceil(eye.maxx) + 6; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = idx(x, y);
      if (isEyeTeal(i)) {
        const key = y * W + x;
        if (!mask.has(key)) {
          mask.add(key);
          queue.push([x, y]);
        }
      }
    }
  }

  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < eye.cx - eye.rx - 8 || nx > eye.cx + eye.rx + 8) continue;
      if (ny < eye.cy - eye.ry - 10 || ny > eye.cy + eye.ry + 8) continue;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const key = ny * W + nx;
      if (mask.has(key)) continue;
      const i = idx(nx, ny);
      if (data[i + 3] < 180) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dark = r < 100 && g < 90 && b < 80;
      const white = r > 190 && g > 190 && b > 190;
      const tealish = g > r + 15 && b > r + 10 && g > 100;
      // Stay inside eye — don't flood into blush (pink) or fur too far.
      const pink = r > 180 && g < 160 && b < 170;
      if (pink) continue;
      if (dark || white || tealish || isEyeTeal(i)) {
        mask.add(key);
        queue.push([nx, ny]);
      }
    }
  }

  // Copy forehead fur into the mask (keeps texture continuity).
  const furLift = Math.round(eye.ry + 28);
  for (const key of mask) {
    const x = key % W;
    const y = Math.floor(key / W);
    const sx = x;
    const sy = Math.max(0, y - furLift);
    const si = idx(sx, sy);
    const di = idx(x, y);
    // Prefer a fur pixel; if source is transparent/teal, use cream fallback.
    if (data[si + 3] > 200 && !isEyeTeal(si) && !(data[si] < 100 && data[si + 1] < 90)) {
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
    } else {
      out[di] = 255;
      out[di + 1] = 241;
      out[di + 2] = 230;
    }
  }

  // Soft dilate: one-pixel ring around mask also gets fur so no teal halo remains.
  for (const key of [...mask]) {
    const x = key % W;
    const y = Math.floor(key / W);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const nkey = ny * W + nx;
      if (mask.has(nkey)) continue;
      const i = idx(nx, ny);
      if (data[i + 3] < 180) continue;
      if (isEyeTeal(i) || (data[i] > 190 && data[i + 1] > 190 && data[i + 2] > 190)) {
        const si = idx(nx, Math.max(0, ny - furLift));
        out[i] = data[si + 3] > 200 ? data[si] : 255;
        out[i + 1] = data[si + 3] > 200 ? data[si + 1] : 241;
        out[i + 2] = data[si + 3] > 200 ? data[si + 2] : 230;
      }
    }
  }

  // Closed-eye line
  const rx = eye.rx * 0.85;
  const yBase = eye.cy + 1;
  const thickness = 3.2;
  for (let t = 0; t <= 1; t += 0.0012) {
    const x = eye.cx - rx + rx * 2 * t;
    const y = yBase + Math.sin(Math.PI * t) * (eye.ry * 0.32);
    for (let oy = -thickness; oy <= thickness; oy++) {
      for (let ox = -thickness; ox <= thickness; ox++) {
        if (ox * ox + oy * oy > thickness * thickness) continue;
        const px = Math.round(x + ox);
        const py = Math.round(y + oy);
        if (px < 0 || py < 0 || px >= W || py >= H) continue;
        const i = idx(px, py);
        if (out[i + 3] < 160) continue;
        out[i] = 75;
        out[i + 1] = 55;
        out[i + 2] = 42;
      }
    }
  }
}

coverEye(L);
coverEye(R);

const result = new PNG({ width: W, height: H });
out.copy(result.data);
fs.writeFileSync(OUT, PNG.sync.write(result));
console.log('wrote', OUT);
console.log({ L, R, eyePixels: eyes.length });

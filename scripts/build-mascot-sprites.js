/**
 * Build Auri sprite frames from AI-generated art.
 *
 * Each source PNG is drawn on a solid magenta backdrop. This script chroma-keys
 * the backdrop out, then normalizes every pose onto a shared canvas so the
 * character stays the same size across frames (especially the run cycle).
 *
 * Usage: node scripts/build-mascot-sprites.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SRC_DIR =
  process.argv[2] ||
  path.join(
    process.env.USERPROFILE || '',
    '.cursor',
    'projects',
    'c-Other-Projects-Trivia-App',
    'assets',
  );
const OUT_DIR = path.join(__dirname, '..', 'assets', 'mascot');
const CANVAS = 512;
const PADDING = 10;

const FRAMES = [
  { out: 'auri-idle.png', src: 'auri-pose-idle.png' },
  { out: 'auri-wave.png', src: 'auri-mascot-magenta.png' },
  { out: 'auri-think.png', src: 'auri-pose-think.png' },
  { out: 'auri-explain.png', src: 'auri-pose-explain.png' },
  { out: 'auri-cheer.png', src: 'auri-pose-cheer.png' },
  { out: 'auri-proud.png', src: 'auri-pose-proud.png' },
  { out: 'auri-lick.png', src: 'auri-pose-lick.png' },
  { out: 'auri-beckon.png', src: 'auri-pose-beckon.png' },
  // Run cycle — all share one footprint so size never jumps.
  { out: 'auri-run.png', src: 'auri-pose-run.png', group: 'run' },
  { out: 'auri-run2.png', src: 'auri-pose-run2.png', group: 'run' },
  { out: 'auri-run3.png', src: 'auri-pose-run3.png', group: 'run' },
  { out: 'auri-run4.png', src: 'auri-pose-run4.png', group: 'run' },
  // Gaze toward a screen direction (head + eyes only — body stays upright).
  { out: 'auri-gaze-left.png', src: 'auri-pose-gaze-left-v2.png' },
  { out: 'auri-gaze-right.png', src: 'auri-pose-gaze-right-v3.png' },
  { out: 'auri-face.png', src: 'auri-pose-face.png', fill: 0.96 },
];

const HARD = 90;

function magentaScore(data, i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  return Math.min(r, b) - g;
}

function keyOut(png) {
  const { width, height, data } = png;
  const visited = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push([x, 0], [x, height - 1]);
  for (let y = 0; y < height; y++) stack.push([0, y], [width - 1, y]);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const flat = width * y + x;
    if (visited[flat]) continue;
    visited[flat] = 1;
    const i = flat << 2;
    if (magentaScore(data, i) < HARD) continue;
    data[i + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  for (let flat = 0; flat < width * height; flat++) {
    const i = flat << 2;
    if (data[i + 3] !== 0 && magentaScore(data, i) >= HARD) data[i + 3] = 0;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) << 2;
      if (data[i + 3] === 0) continue;
      let edge = false;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (data[((width * ny + nx) << 2) + 3] === 0) {
          edge = true;
          break;
        }
      }
      if (!edge) continue;
      const score = magentaScore(data, i);
      if (score > 20) {
        const g = data[i + 1];
        data[i] = Math.min(data[i], g + 30);
        data[i + 2] = Math.min(data[i + 2], g + 30);
        data[i + 3] = Math.max(0, 255 - score * 2);
      }
    }
  }
  return png;
}

function bbox(png) {
  const { width, height, data } = png;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[((width * y + x) << 2) + 3] > 24) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function sample(png, sx, sy) {
  const { width, height, data } = png;
  const x = Math.max(0, Math.min(width - 1, Math.round(sx)));
  const y = Math.max(0, Math.min(height - 1, Math.round(sy)));
  const i = (width * y + x) << 2;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

/** Place source bbox into a fixed destination rect (feet on bottom, centered). */
function composeIntoRect(png, box, dest) {
  const out = new PNG({ width: CANVAS, height: CANVAS });
  out.data.fill(0);

  const scale = Math.min(dest.w / box.w, dest.h / box.h);
  const drawW = box.w * scale;
  const drawH = box.h * scale;
  const left = dest.x + (dest.w - drawW) / 2;
  const top = dest.y + dest.h - drawH; // feet aligned to bottom of dest

  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      const u = (x - left) / scale;
      const v = (y - top) / scale;
      if (u < 0 || v < 0 || u >= box.w || v >= box.h) continue;
      const [r, g, b, a] = sample(png, box.x + u, box.y + v);
      const o = (CANVAS * y + x) << 2;
      out.data[o] = r;
      out.data[o + 1] = g;
      out.data[o + 2] = b;
      out.data[o + 3] = a;
    }
  }
  return out;
}

const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const file = path.join(SRC_DIR, name);
  const png = keyOut(PNG.sync.read(fs.readFileSync(file)));
  const entry = { png, box: bbox(png) };
  cache.set(name, entry);
  return entry;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// Shared destination rects per group so every frame in the group is the same size.
const groupDest = new Map();
for (const frame of FRAMES) {
  if (!frame.group) continue;
  const { box } = load(frame.src);
  const prev = groupDest.get(frame.group) || { w: 0, h: 0 };
  groupDest.set(frame.group, {
    w: Math.max(prev.w, box.w),
    h: Math.max(prev.h, box.h),
  });
}

for (const [group, maxBox] of groupDest) {
  const fit = CANVAS - PADDING * 2;
  // Fill height so the runner matches the visual weight of standing poses.
  // Wide frames may clip a bit on the sides — that's fine for a side-run.
  let scale = fit / maxBox.h;
  let destW = maxBox.w * scale;
  let destH = fit;
  if (group !== 'run' && destW > fit) {
    scale = fit / maxBox.w;
    destW = fit;
    destH = maxBox.h * scale;
  }
  groupDest.set(group, {
    x: (CANVAS - destW) / 2,
    y: (CANVAS - destH) / 2,
    w: destW,
    h: destH,
  });
  console.log(
    `group:${group} dest=${Math.round(destW)}x${Math.round(destH)} scale=${scale.toFixed(3)}`,
  );
}

for (const frame of FRAMES) {
  const { png, box } = load(frame.src);
  let dest;

  if (frame.group && groupDest.has(frame.group)) {
    dest = groupDest.get(frame.group);
  } else {
    const pad = frame.fill ? Math.round((CANVAS * (1 - frame.fill)) / 2) : PADDING;
    const fit = CANVAS - pad * 2;
    const scale = Math.min(fit / box.w, fit / box.h);
    const destW = box.w * scale;
    const destH = box.h * scale;
    dest = {
      x: (CANVAS - destW) / 2,
      y: (CANVAS - destH) / 2,
      w: destW,
      h: destH,
    };
  }

  const out = composeIntoRect(png, box, dest);
  const destPath = path.join(OUT_DIR, frame.out);
  fs.writeFileSync(destPath, PNG.sync.write(out));
  console.log(`${frame.out}  src=${frame.src}  bbox=${box.w}x${box.h}`);
}

console.log('\nSprites written to', OUT_DIR);

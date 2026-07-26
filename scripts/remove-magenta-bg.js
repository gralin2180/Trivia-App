// One-shot: chroma-key the magenta background out of the generated mascot PNG.
// Usage: node scripts/remove-magenta-bg.js <input.png> <output.png>
const fs = require('fs');
const { PNG } = require('pngjs');

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('usage: node remove-magenta-bg.js <in.png> <out.png>');
  process.exit(1);
}

const png = PNG.sync.read(fs.readFileSync(inPath));
const { width, height, data } = png;

function idx(x, y) {
  return (width * y + x) << 2;
}

function magentaScore(i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  // Magenta: high red + blue, low green relative to both.
  const minRB = Math.min(r, b);
  return minRB - g; // > 0 means magenta-ish; background is strongly positive
}

// Flood fill from all border pixels so interior pinks are never touched.
const visited = new Uint8Array(width * height);
const queue = [];
for (let x = 0; x < width; x++) {
  queue.push([x, 0], [x, height - 1]);
}
for (let y = 0; y < height; y++) {
  queue.push([0, y], [width - 1, y]);
}

const HARD = 90; // definitely background
while (queue.length) {
  const [x, y] = queue.pop();
  if (x < 0 || y < 0 || x >= width || y >= height) continue;
  const flat = width * y + x;
  if (visited[flat]) continue;
  visited[flat] = 1;
  const i = flat << 2;
  if (magentaScore(i) < HARD) continue;
  data[i + 3] = 0;
  queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// Global pass: kill strongly-magenta pockets enclosed by the character
// (e.g. gaps between paw and collar that flood fill can't reach).
for (let flat = 0; flat < width * height; flat++) {
  const i = flat << 2;
  if (data[i + 3] !== 0 && magentaScore(i) >= HARD) {
    data[i + 3] = 0;
  }
}

// De-fringe: soften pixels that touch transparency and still carry magenta cast.
const out = Buffer.from(data);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = idx(x, y);
    if (data[i + 3] === 0) continue;
    let touchesHole = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (data[idx(nx, ny) + 3] === 0) {
        touchesHole = true;
        break;
      }
    }
    if (!touchesHole) continue;
    const score = magentaScore(i);
    if (score > 20) {
      // Kill the magenta cast on the rim and feather alpha.
      const g = data[i + 1];
      out[i] = Math.min(data[i], g + 30);
      out[i + 2] = Math.min(data[i + 2], g + 30);
      out[i + 3] = Math.max(0, 255 - score * 2) | 0;
    }
  }
}

const result = new PNG({ width, height });
out.copy(result.data);
fs.writeFileSync(outPath, PNG.sync.write(result));
console.log('done:', outPath);

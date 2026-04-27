// Generates jtac-audio toolbar icons (16/48/128 PNG) into public/.
// Design: dark rounded square with a circle split L/R into channel colors.
// Pure JS via pngjs — no native binaries, no SVG renderer.

import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const outDir = resolve(projectRoot, 'public');
const sizes = [16, 48, 128];

const BG = [0x15, 0x18, 0x1d];        // ink-800
const LEFT = [0x3e, 0xa6, 0x6a];      // channel green
const RIGHT = [0xe0, 0x84, 0x3a];     // channel orange

function makeIcon(size) {
  const png = new PNG({ width: size, height: size });
  const cornerRadius = Math.max(2, Math.round(size * 0.18));
  const center = size / 2;
  const circleRadius = size * 0.42;
  const dividerHalf = Math.max(0.5, size * 0.012);

  const corners = [
    { cx: cornerRadius, cy: cornerRadius, qx: -1, qy: -1 },
    { cx: size - cornerRadius - 1, cy: cornerRadius, qx: 1, qy: -1 },
    { cx: cornerRadius, cy: size - cornerRadius - 1, qx: -1, qy: 1 },
    { cx: size - cornerRadius - 1, cy: size - cornerRadius - 1, qx: 1, qy: 1 },
  ];

  function inRoundedRect(x, y) {
    for (const c of corners) {
      const inQuadrantX = c.qx === -1 ? x < cornerRadius : x >= size - cornerRadius;
      const inQuadrantY = c.qy === -1 ? y < cornerRadius : y >= size - cornerRadius;
      if (inQuadrantX && inQuadrantY) {
        return Math.hypot(x - c.cx, y - c.cy) <= cornerRadius;
      }
    }
    return true;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const px = x + 0.5;
      const py = y + 0.5;

      if (!inRoundedRect(x, y)) {
        png.data[idx + 0] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      const dx = px - center;
      const dy = py - center;
      const dist = Math.hypot(dx, dy);

      let color = BG;
      if (dist <= circleRadius) {
        if (Math.abs(dx) < dividerHalf) {
          color = BG;
        } else if (dx < 0) {
          color = LEFT;
        } else {
          color = RIGHT;
        }
      }

      png.data[idx + 0] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = 255;
    }
  }

  return PNG.sync.write(png);
}

mkdirSync(outDir, { recursive: true });
for (const size of sizes) {
  const buf = makeIcon(size);
  const out = resolve(outDir, `icon-${size}.png`);
  writeFileSync(out, buf);
  console.log(`wrote ${out}  (${buf.length} bytes)`);
}

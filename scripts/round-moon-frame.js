#!/usr/bin/env node

/**
 * Apply a circular alpha mask to NASA moon phase frames (720×720).
 * Defaults match analysis: center at image midpoint, radius = min(w,h)/2 - 28.
 *
 * Usage:
 *   node scripts/round-moon-frame.js --in src/assets/phases --out src/assets/phases-round
 *   node scripts/round-moon-frame.js --in src/assets/phases/moon.0001.jpg --out /tmp/moon.0001.png
 */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('❌ sharp is required. Install with: npm install sharp');
  process.exit(1);
}

const FRAME_RE = /^moon\.(\d{4})\.(jpg|jpeg|png|webp)$/i;

function parseArgs(argv) {
  const opts = {
    inPath: null,
    outPath: null,
    format: 'png',
    cx: null,
    cy: null,
    radius: null,
    feather: 1.5,
    margin: 28,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--in') opts.inPath = argv[++i];
    else if (arg === '--out') opts.outPath = argv[++i];
    else if (arg === '--format') opts.format = argv[++i];
    else if (arg === '--cx') opts.cx = Number(argv[++i]);
    else if (arg === '--cy') opts.cy = Number(argv[++i]);
    else if (arg === '--radius') opts.radius = Number(argv[++i]);
    else if (arg === '--feather') opts.feather = Number(argv[++i]);
    else if (arg === '--margin') opts.margin = Number(argv[++i]);
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage:
  node scripts/round-moon-frame.js --in <file|dir> --out <file|dir> [options]

Options:
  --format png|webp     Output format (default: png)
  --cx, --cy <n>        Circle center (default: image center)
  --radius <n>          Circle radius (default: min(w,h)/2 - margin)
  --margin <n>          Pixels inside edge when radius omitted (default: 28)
  --feather <n>         Edge softening in px (default: 1.5)
`);
      process.exit(0);
    } else {
      console.error('Unknown argument:', arg);
      process.exit(1);
    }
  }

  if (!opts.inPath || !opts.outPath) {
    console.error('❌ --in and --out are required');
    process.exit(1);
  }

  return opts;
}

function circleMaskSvg(w, h, cx, cy, r, feather) {
  const blur =
    feather > 0
      ? `<defs><filter id="blur"><feGaussianBlur stdDeviation="${feather}"/></filter></defs>
         <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" filter="url(#blur)"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/>`;
  return Buffer.from(`<svg width="${w}" height="${h}">${blur}</svg>`);
}

/**
 * @param {string} input
 * @param {string} output
 * @param {object} [opts]
 * @param {number} [opts.cx]
 * @param {number} [opts.cy]
 * @param {number} [opts.radius]
 * @param {number} [opts.margin]
 * @param {number} [opts.feather]
 * @param {'png'|'webp'} [opts.format]
 */
async function roundMoonFrame(input, output, opts = {}) {
  const meta = await sharp(input).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) {
    throw new Error(`Could not read dimensions: ${input}`);
  }

  const cx = opts.cx ?? w / 2;
  const cy = opts.cy ?? h / 2;
  const margin = opts.margin ?? 28;
  const r = opts.radius ?? Math.floor(Math.min(w, h) / 2) - margin;
  const feather = opts.feather ?? 1.5;
  const format = opts.format ?? 'png';

  const mask = circleMaskSvg(w, h, cx, cy, r, feather);
  let pipeline = sharp(input)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }]);

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality: opts.quality ?? 90 });
  } else {
    pipeline = pipeline.png({ compressionLevel: 9 });
  }

  await pipeline.toFile(output);
  return { input, output, cx, cy, r, format };
}

function listFrames(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => FRAME_RE.test(f))
    .sort((a, b) => {
      const ai = parseInt(a.match(/(\d{4})/)[1], 10);
      const bi = parseInt(b.match(/(\d{4})/)[1], 10);
      return ai - bi;
    });
}

function outputPathFor(inputFile, outDir, format) {
  const base = path.basename(inputFile).replace(/\.[^.]+$/, '');
  const ext = format === 'webp' ? '.webp' : '.png';
  return path.join(outDir, base + ext);
}

async function main() {
  const cli = parseArgs(process.argv);
  const inStat = fs.statSync(cli.inPath);
  const processOpts = {
    cx: cli.cx,
    cy: cli.cy,
    radius: cli.radius,
    margin: cli.margin,
    feather: cli.feather,
    format: cli.format,
  };

  if (inStat.isFile()) {
    const outDir = path.dirname(cli.outPath);
    if (outDir && !fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const result = await roundMoonFrame(cli.inPath, cli.outPath, processOpts);
    console.log(`✅ ${result.input} → ${result.output} (r=${result.r})`);
    return;
  }

  if (!inStat.isDirectory()) {
    console.error('❌ --in must be a file or directory');
    process.exit(1);
  }

  if (!fs.existsSync(cli.outPath)) {
    fs.mkdirSync(cli.outPath, { recursive: true });
  }

  const frames = listFrames(cli.inPath);
  if (frames.length === 0) {
    console.error('❌ No moon.NNNN.* frames found in', cli.inPath);
    process.exit(1);
  }

  console.log(`🌙 Processing ${frames.length} frames…`);
  for (const file of frames) {
    const input = path.join(cli.inPath, file);
    const output = outputPathFor(file, cli.outPath, cli.format);
    await roundMoonFrame(input, output, processOpts);
  }
  console.log(`✅ Wrote ${frames.length} files to ${cli.outPath}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { roundMoonFrame, circleMaskSvg };

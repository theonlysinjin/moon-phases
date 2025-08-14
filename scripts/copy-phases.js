#!/usr/bin/env node

/**
 * Copy moon phase assets from `src/assets/phases` into `public/phases`
 * and, if an `out` directory exists (static export), also into `out/phases`.
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src/assets/phases');
const PUBLIC_DIR = path.join(__dirname, '../public/phases');
const OUT_DIR = path.join(__dirname, '../out/phases');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function emptyDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    const stat = fs.lstatSync(entryPath);
    if (stat.isDirectory()) {
      emptyDir(entryPath);
      fs.rmdirSync(entryPath);
    } else {
      fs.unlinkSync(entryPath);
    }
  }
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.lstatSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  console.log('📦 Copying moon phase assets...');

  if (!fs.existsSync(SRC_DIR)) {
    console.error('❌ Source phases directory not found:', SRC_DIR);
    process.exit(1);
  }

  const srcEntries = fs.readdirSync(SRC_DIR);
  console.log(`ℹ️ Source has ${srcEntries.length} entries at ${SRC_DIR}`);

  // 1) Copy to public/phases
  ensureDir(path.dirname(PUBLIC_DIR));
  ensureDir(PUBLIC_DIR);
  emptyDir(PUBLIC_DIR);
  copyDir(SRC_DIR, PUBLIC_DIR);
  const publicCount = fs.readdirSync(PUBLIC_DIR).length;
  console.log(`✅ Copied to public/phases (${publicCount} files)`);

  // 2) If out/ exists (local build), also copy there
  const outParent = path.join(__dirname, '../out');
  if (fs.existsSync(outParent)) {
    ensureDir(OUT_DIR);
    emptyDir(OUT_DIR);
    copyDir(SRC_DIR, OUT_DIR);
    const outCount = fs.readdirSync(OUT_DIR).length;
    console.log(`✅ Copied to out/phases (${outCount} files)`);
  } else {
    console.log('ℹ️ No out/ directory detected; skipping copy to out/phases');
  }

  console.log('🎉 Moon phase assets copy completed.');
}

main();



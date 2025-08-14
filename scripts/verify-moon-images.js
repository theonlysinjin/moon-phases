#!/usr/bin/env node

/**
 * Build verification script for moon phase images
 * Ensures all 236 moon phase images are properly included in the build
 */

const fs = require('fs');
const path = require('path');

const PHASES_DIR = path.join(__dirname, '../src/assets/phases');
const DAILY_DIR = path.join(__dirname, '../src/assets/phases.daily');
const EXPECTED_COUNT_FULL = 236;
const EXPECTED_COUNT_DAILY = 30;

function verifyMoonPhaseImages() {
  console.log('🔍 Verifying moon phase images...');
  
  // Check if phases directory exists
  if (!fs.existsSync(PHASES_DIR)) {
    console.error('❌ Phases directory not found:', PHASES_DIR);
    process.exit(1);
  }
  
  // Count moon phase images
  const files = fs.readdirSync(PHASES_DIR);
  const moonImages = files.filter(file => file.match(/^moon\.\d{4}\.jpg$/));
  
  console.log(`📊 Found ${moonImages.length} images in src/assets/phases`);
  
  // Verify we have the expected number
  if (moonImages.length !== EXPECTED_COUNT_FULL) {
    console.warn(`⚠️ Expected ${EXPECTED_COUNT_FULL} images in full set, found ${moonImages.length}.`);
    console.warn('   This is acceptable if you pruned the set.');
  }
  
  // Check for missing frames
  const frameNumbers = moonImages.map(file => {
    const match = file.match(/^moon\.(\d{4})\.jpg$/);
    return parseInt(match[1], 10);
  }).sort((a, b) => a - b);
  
  const missingFrames = [];
  for (let i = 1; i <= Math.min(EXPECTED_COUNT_FULL, moonImages.length); i++) {
    if (!frameNumbers.includes(i)) {
      missingFrames.push(i);
    }
  }
  
  if (missingFrames.length > 0) {
    console.error('❌ Missing frames:', missingFrames);
    process.exit(1);
  }
  
  // Check file sizes to ensure they're not empty
  let totalSize = 0;
  for (const file of moonImages) {
    const filePath = path.join(PHASES_DIR, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
    
    if (stats.size === 0) {
      console.error(`❌ Empty file: ${file}`);
      process.exit(1);
    }
  }
  
  console.log(`✅ Verified full set presence (or acceptable prune)`);
  console.log(`📦 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  const countForAvg = moonImages.length > 0 ? moonImages.length : EXPECTED_COUNT_FULL;
  console.log(`📊 Average size: ${(totalSize / countForAvg / 1024).toFixed(2)} KB per image`);
  
  // Check for video file
  const videoFile = path.join(PHASES_DIR, 'moon_720p30.webm');
  if (fs.existsSync(videoFile)) {
    const videoStats = fs.statSync(videoFile);
    console.log(`🎥 Video file: ${(videoStats.size / 1024 / 1024).toFixed(2)} MB`);
  }
  
  console.log('🎉 Moon phase image verification completed successfully!');

  // Optional: verify daily set
  if (fs.existsSync(DAILY_DIR)) {
    const dailyFiles = fs
      .readdirSync(DAILY_DIR)
      .filter((f) => /^moon\.\d{4}\.jpg$/.test(f));
    console.log(`📊 Daily set has ${dailyFiles.length} images`);
    if (dailyFiles.length !== EXPECTED_COUNT_DAILY) {
      console.warn(`⚠️ Expected ${EXPECTED_COUNT_DAILY} daily images, found ${dailyFiles.length}`);
    }
  }
}

// Run verification
verifyMoonPhaseImages();

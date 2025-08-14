#!/usr/bin/env node

/**
 * Build verification script for moon phase images
 * Ensures all 236 moon phase images are properly included in the build
 */

const fs = require('fs');
const path = require('path');

const PHASES_DIR = path.join(__dirname, '../src/assets/phases');
const EXPECTED_COUNT = 236;

function verifyMoonPhaseImages() {
  console.log('🔍 Verifying moon phase images...');
  
  // Check if phases directory exists
  if (!fs.existsSync(PHASES_DIR)) {
    console.error('❌ Phases directory not found:', PHASES_DIR);
    process.exit(1);
  }
  
  // Count moon phase images
  const files = fs.readdirSync(PHASES_DIR);
  const moonImages = files.filter(file => 
    file.match(/^moon\.\d{4}\.jpg$/)
  );
  
  console.log(`📊 Found ${moonImages.length} moon phase images`);
  
  // Verify we have the expected number
  if (moonImages.length !== EXPECTED_COUNT) {
    console.error(`❌ Expected ${EXPECTED_COUNT} images, found ${moonImages.length}`);
    process.exit(1);
  }
  
  // Check for missing frames
  const frameNumbers = moonImages.map(file => {
    const match = file.match(/^moon\.(\d{4})\.jpg$/);
    return parseInt(match[1], 10);
  }).sort((a, b) => a - b);
  
  const missingFrames = [];
  for (let i = 1; i <= EXPECTED_COUNT; i++) {
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
  
  console.log(`✅ All ${EXPECTED_COUNT} moon phase images verified`);
  console.log(`📦 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📊 Average size: ${(totalSize / EXPECTED_COUNT / 1024).toFixed(2)} KB per image`);
  
  // Check for video file
  const videoFile = path.join(PHASES_DIR, 'moon_720p30.webm');
  if (fs.existsSync(videoFile)) {
    const videoStats = fs.statSync(videoFile);
    console.log(`🎥 Video file: ${(videoStats.size / 1024 / 1024).toFixed(2)} MB`);
  }
  
  console.log('🎉 Moon phase image verification completed successfully!');
}

// Run verification
verifyMoonPhaseImages();

# Moon Image Optimization

This document describes the optimizations implemented to ensure all moon phase images are included at build time for faster loading performance.

## Overview

The moon calendar application uses 236 high-quality moon phase images (moon.0001.jpg to moon.0236.jpg) to display accurate lunar phases. Previously, these images were loaded dynamically using webpack's `require.context`, but this approach could lead to slower loading times and potential runtime errors.

## Optimizations Implemented

### 1. Build-Time Image Preloading

**File**: `src/utils/moonPhaseImageLoader.ts`

- All 236 moon phase images are now preloaded at build time
- Images are stored in a static object for instant access
- Eliminates runtime loading delays
- Provides better error handling and fallbacks

### 2. Optimized Image Loading Utility

**File**: `src/utils/getMoonPhaseVisual.tsx`

- Simplified image loading using the new optimized loader
- Better performance with lazy loading
- Improved error handling
- Consistent image access across all themes

### 3. Application-Level Preloading

**File**: `src/components/MoonPhaseImagePreloader.tsx`

- Component that preloads all images during app initialization
- Ensures images are ready before user interaction
- Provides debugging information about loaded images

### 4. Build Verification

**File**: `scripts/verify-moon-images.js`

- Verifies all 236 images are present before build
- Checks for missing frames and empty files
- Reports total size and performance metrics
- Integrated into the build process

### 5. Next.js Configuration Optimization

**File**: `next.config.ts`

- Enhanced webpack configuration for better asset handling
- Optimized image processing settings
- Ensures all images are properly included in the build

## Performance Benefits

### Before Optimization
- Images loaded dynamically at runtime
- Potential loading delays
- Risk of missing images causing errors
- No build-time verification

### After Optimization
- All images preloaded at build time
- Instant image access
- Guaranteed availability of all 236 frames
- Build-time verification prevents deployment issues
- Better caching and performance

## Usage

### Development
```bash
# Verify images are present
npm run verify-images

# Start development server
npm run dev
```

### Production Build
```bash
# Build with image verification
npm run build
```

The build process will:
1. Verify all 236 moon phase images are present
2. Preload all images at build time
3. Include optimized image loading in the bundle
4. Generate static export with all images included

## Image Statistics

- **Total Images**: 236 frames
- **Total Size**: ~18.88 MB
- **Average Size**: ~81.91 KB per image
- **Video File**: ~0.85 MB (for hourly timeline theme)
- **Format**: JPG (optimized for web)

## File Structure

```
src/
├── assets/
│   └── phases/
│       ├── moon.0001.jpg
│       ├── moon.0002.jpg
│       ├── ...
│       ├── moon.0236.jpg
│       └── moon_720p30.webm
├── utils/
│   ├── moonPhaseImageLoader.ts    # Optimized image loader
│   └── getMoonPhaseVisual.tsx     # Visual component utility
├── components/
│   └── MoonPhaseImagePreloader.tsx # Preloader component
└── scripts/
    └── verify-moon-images.js      # Build verification
```

## Technical Details

### Image Loading Algorithm
```typescript
// Frame calculation based on moon age
const days = Math.max(0, moonAgeDays);
const nearestFrame = Math.round(days * 8) + 1; // 1..236
```

### Build-Time Preloading
```typescript
// All images imported at build time
for (let i = 1; i <= 236; i++) {
  const frameStr = String(i).padStart(4, "0");
  const key = `moon.${frameStr}.jpg`;
  const imageModule = require(`../assets/phases/${key}`);
  MOON_PHASE_IMAGES[key] = imageModule.default || imageModule;
}
```

## Monitoring and Debugging

The optimization includes several debugging features:

1. **Console Logging**: Reports number of preloaded images
2. **Build Verification**: Ensures all images are present
3. **Error Handling**: Graceful fallbacks for missing images
4. **Performance Metrics**: Size and loading statistics

## Future Improvements

Potential future optimizations:
- Image compression and optimization
- WebP format conversion for smaller file sizes
- Progressive loading for very large datasets
- CDN integration for global distribution
- Image caching strategies

## Troubleshooting

### Missing Images
If the verification script fails:
1. Check that all 236 images exist in `src/assets/phases/`
2. Ensure images are not empty or corrupted
3. Verify file naming convention (moon.0001.jpg to moon.0236.jpg)

### Build Failures
If the build fails:
1. Run `npm run verify-images` to identify issues
2. Check console output for specific error messages
3. Ensure all dependencies are installed

### Performance Issues
If images load slowly:
1. Check network conditions
2. Verify images are properly cached
3. Monitor browser developer tools for loading times

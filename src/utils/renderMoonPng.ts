import type { MoonPhaseEntry } from '@/types/moonPhase';
import { getMoonPhaseImageByAge } from './moonPhaseImageLoader';

/** Draw a moon phase entry to a PNG data URL (rotation + circular clip). */
export function renderMoonPhasePng(
  entry: MoonPhaseEntry,
  size: number = 512
): Promise<string> {
  return new Promise((resolve, reject) => {
    const imgSrc = getMoonPhaseImageByAge(entry.moon_age_days);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((entry.rotation_angle * Math.PI) / 180);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load moon image'));
    img.src = imgSrc;
  });
}

/** Replace the page with a full-viewport PNG (for type=image-only&format=png). */
export function showPngOnly(dataUrl: string): void {
  document.documentElement.style.background = '#000';
  document.body.replaceChildren();
  document.body.style.margin = '0';
  document.body.style.background = '#000';
  document.body.style.minHeight = '100vh';
  document.body.style.display = 'flex';
  document.body.style.alignItems = 'center';
  document.body.style.justifyContent = 'center';

  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = 'Moon phase';
  img.style.display = 'block';
  img.style.maxWidth = '100vw';
  img.style.maxHeight = '100vh';
  img.style.objectFit = 'contain';
  document.body.appendChild(img);
}

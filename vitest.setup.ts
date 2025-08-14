import { beforeAll } from 'vitest';

// Ensure stable timezone for tests when converting to local time
beforeAll(() => {
  // JSDOM uses system timezone; specify Africa/Johannesburg for consistency if needed
  process.env.TZ = 'Africa/Johannesburg';
});








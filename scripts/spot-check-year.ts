/**
 * Spot check: compare astronomy-engine vs timeanddate lunation tables.
 * Run: npx tsx scripts/spot-check-year.ts 2028
 */

import { DateTime } from 'luxon';
import { CITIES, presetByLabel } from '../src/config/cities';
import { generateMoonPhases } from '../src/utils/generateMoonPhases';
import { getMajorMoonPhasesAstronomyEngine } from '../src/app/moonPhaseMath';
import { DEFAULT_VIEW_HOUR } from '../src/types/api';
import {
  parseTimeAndDateFixture,
  toLocalDateTime,
  closestPhaseMinutes,
  type PhaseName,
} from '../test/lib/timeanddateFixtures';

/** timeanddate.com lunation tables (24h local), sourced May 2026. */
const FIXTURES_2028: Record<string, string> = {
  'cape-town': `Lunation\tNew Moon\tFirst Quarter\tFull Moon\tThird Quarter\tDuration
1299\t\t\t5 Jan\t03:40\t12 Jan\t06:02\t18 Jan\t21:25\t29d 19h 00m
1300\t26 Jan\t17:12\t3 Feb\t21:10\t10 Feb\t17:03\t17 Feb\t10:07\t29d 19h 25m
1301\t25 Feb\t12:37\t4 Mar\t11:02\t11 Mar\t03:06\t18 Mar\t01:22\t29d 17h 54m
1302\t26 Mar\t06:31\t2 Apr\t21:15\t9 Apr\t12:26\t16 Apr\t18:36\t29d 15h 16m
1303\t24 Apr\t21:46\t2 May\t04:25\t8 May\t21:48\t16 May\t12:43\t29d 12h 29m
1304\t24 May\t10:16\t31 May\t09:36\t7 Jun\t08:08\t15 Jun\t06:27\t29d 10h 11m
1305\t22 Jun\t20:27\t29 Jun\t14:10\t6 Jul\t20:10\t14 Jul\t22:56\t29d 8h 34m
1306\t22 Jul\t05:01\t28 Jul\t19:40\t5 Aug\t10:09\t13 Aug\t13:45\t29d 7h 42m
1307\t20 Aug\t12:43\t27 Aug\t03:35\t4 Sep\t01:47\t12 Sep\t02:45\t29d 7h 40m
1308\t18 Sep\t20:23\t25 Sep\t15:10\t3 Oct\t18:25\t11 Oct\t13:56\t29d 8h 33m
1309\t18 Oct\t04:56\t25 Oct\t06:53\t2 Nov\t11:17\t9 Nov\t23:25\t29d 10h 21m
1310\t16 Nov\t15:18\t24 Nov\t02:14\t2 Dec\t03:40\t9 Dec\t07:38\t29d 12h 48m
1311\t16 Dec\t04:06\t23 Dec\t23:44\t31 Dec\t18:48\t\t\t29d 15h 18m`,

  london: `Lunation\tNew Moon\tFirst Quarter\tFull Moon\tThird Quarter\tDuration
1299\t\t\t5 Jan\t01:40\t12 Jan\t04:03\t18 Jan\t19:25\t29d 19h 00m
1300\t26 Jan\t15:12\t3 Feb\t19:10\t10 Feb\t15:03\t17 Feb\t08:08\t29d 19h 25m
1301\t25 Feb\t10:37\t4 Mar\t09:02\t11 Mar\t01:06\t17 Mar\t23:22\t29d 17h 54m
1302\t26 Mar\t05:31\t2 Apr\t20:15\t9 Apr\t11:26\t16 Apr\t17:36\t29d 15h 16m
1303\t24 Apr\t20:46\t2 May\t03:25\t8 May\t20:48\t16 May\t11:43\t29d 12h 29m
1304\t24 May\t09:16\t31 May\t08:36\t7 Jun\t07:08\t15 Jun\t05:27\t29d 10h 11m
1305\t22 Jun\t19:27\t29 Jun\t13:10\t6 Jul\t19:10\t14 Jul\t21:56\t29d 8h 34m
1306\t22 Jul\t04:01\t28 Jul\t18:40\t5 Aug\t09:09\t13 Aug\t12:45\t29d 7h 42m
1307\t20 Aug\t11:43\t27 Aug\t02:35\t4 Sep\t00:47\t12 Sep\t01:45\t29d 7h 40m
1308\t18 Sep\t19:23\t25 Sep\t14:10\t3 Oct\t17:25\t11 Oct\t12:56\t29d 8h 33m
1309\t18 Oct\t03:56\t25 Oct\t05:53\t2 Nov\t09:17\t9 Nov\t21:25\t29d 10h 21m
1310\t16 Nov\t13:17\t24 Nov\t00:14\t2 Dec\t01:40\t9 Dec\t05:38\t29d 12h 48m
1311\t16 Dec\t02:06\t23 Dec\t21:44\t31 Dec\t16:48\t\t\t29d 15h 18m`,

  'new-york': `Lunation\tNew Moon\tFirst Quarter\tFull Moon\tThird Quarter\tDuration
1299\t\t\t4 Jan\t20:40\t11 Jan\t23:02\t18 Jan\t14:25\t29d 19h 00m
1300\t26 Jan\t10:12\t3 Feb\t14:10\t10 Feb\t10:03\t17 Feb\t03:07\t29d 19h 25m
1301\t25 Feb\t05:37\t4 Mar\t04:02\t10 Mar\t20:06\t17 Mar\t19:22\t29d 17h 54m
1302\t26 Mar\t00:31\t2 Apr\t15:15\t9 Apr\t06:26\t16 Apr\t12:36\t29d 15h 16m
1303\t24 Apr\t15:46\t1 May\t22:25\t8 May\t15:48\t16 May\t06:43\t29d 12h 29m
1304\t24 May\t04:16\t31 May\t03:36\t7 Jun\t02:08\t15 Jun\t00:27\t29d 10h 11m
1305\t22 Jun\t14:27\t29 Jun\t08:10\t6 Jul\t14:10\t14 Jul\t16:56\t29d 8h 34m
1306\t21 Jul\t23:01\t28 Jul\t13:40\t5 Aug\t04:09\t13 Aug\t07:45\t29d 7h 42m
1307\t20 Aug\t06:43\t26 Aug\t21:35\t3 Sep\t19:47\t11 Sep\t20:45\t29d 7h 40m
1308\t18 Sep\t14:23\t25 Sep\t09:10\t3 Oct\t12:25\t11 Oct\t07:56\t29d 8h 33m
1309\t17 Oct\t22:56\t25 Oct\t00:53\t2 Nov\t05:17\t9 Nov\t16:25\t29d 10h 21m
1310\t16 Nov\t08:18\t23 Nov\t19:14\t1 Dec\t20:40\t9 Dec\t00:38\t29d 12h 48m
1311\t15 Dec\t21:06\t23 Dec\t16:44\t31 Dec\t11:48\t\t\t29d 15h 18m`,

  'hong-kong': `Lunation\tNew Moon\tFirst Quarter\tFull Moon\tThird Quarter\tDuration
1299\t\t\t5 Jan\t09:40\t12 Jan\t12:02\t19 Jan\t03:25\t29d 19h 00m
1300\t26 Jan\t23:12\t4 Feb\t03:10\t10 Feb\t23:03\t17 Feb\t16:07\t29d 19h 25m
1301\t25 Feb\t18:37\t4 Mar\t17:02\t11 Mar\t09:06\t18 Mar\t07:22\t29d 17h 54m
1302\t26 Mar\t12:31\t3 Apr\t03:15\t9 Apr\t18:26\t17 Apr\t00:36\t29d 15h 16m
1303\t25 Apr\t03:46\t2 May\t10:25\t9 May\t03:48\t16 May\t18:43\t29d 12h 29m
1304\t24 May\t16:16\t31 May\t15:36\t7 Jun\t14:08\t15 Jun\t12:27\t29d 10h 11m
1305\t23 Jun\t02:27\t29 Jun\t20:10\t7 Jul\t02:10\t15 Jul\t04:56\t29d 8h 34m
1306\t22 Jul\t11:01\t29 Jul\t01:40\t5 Aug\t16:09\t13 Aug\t19:45\t29d 7h 42m
1307\t20 Aug\t18:43\t27 Aug\t09:35\t4 Sep\t07:47\t12 Sep\t08:45\t29d 7h 40m
1308\t19 Sep\t02:23\t25 Sep\t21:10\t4 Oct\t00:25\t11 Oct\t19:56\t29d 8h 33m
1309\t18 Oct\t10:56\t25 Oct\t12:53\t2 Nov\t17:17\t10 Nov\t05:25\t29d 10h 21m
1310\t16 Nov\t21:18\t24 Nov\t08:14\t2 Dec\t09:40\t9 Dec\t13:38\t29d 12h 48m
1311\t16 Dec\t10:06\t24 Dec\t05:44\t\t\t\t\t29d 15h 18m`,

  melbourne: `Lunation\tNew Moon\tFirst Quarter\tFull Moon\tThird Quarter\tDuration
1299\t\t\t5 Jan\t12:40\t12 Jan\t15:03\t19 Jan\t06:25\t29d 19h 00m
1300\t27 Jan\t02:12\t4 Feb\t06:10\t11 Feb\t02:03\t17 Feb\t19:08\t29d 19h 25m
1301\t25 Feb\t21:37\t4 Mar\t20:02\t11 Mar\t12:06\t18 Mar\t10:22\t29d 17h 54m
1302\t26 Mar\t15:31\t3 Apr\t05:15\t9 Apr\t20:26\t17 Apr\t02:36\t29d 15h 16m
1303\t25 Apr\t05:46\t2 May\t12:25\t9 May\t05:48\t16 May\t20:43\t29d 12h 29m
1304\t24 May\t18:16\t31 May\t17:36\t7 Jun\t16:08\t15 Jun\t14:27\t29d 10h 11m
1305\t23 Jun\t04:27\t29 Jun\t22:10\t7 Jul\t04:10\t15 Jul\t06:56\t29d 8h 34m
1306\t22 Jul\t13:01\t29 Jul\t03:40\t5 Aug\t18:09\t13 Aug\t21:45\t29d 7h 42m
1307\t20 Aug\t20:43\t27 Aug\t11:35\t4 Sep\t09:47\t12 Sep\t10:45\t29d 7h 40m
1308\t19 Sep\t04:23\t25 Sep\t23:10\t4 Oct\t03:25\t11 Oct\t22:56\t29d 8h 33m
1309\t18 Oct\t13:56\t25 Oct\t15:53\t2 Nov\t20:17\t10 Nov\t08:25\t29d 10h 21m
1310\t17 Nov\t00:17\t24 Nov\t11:14\t2 Dec\t12:40\t9 Dec\t16:38\t29d 12h 48m
1311\t16 Dec\t13:06\t24 Dec\t08:44\t\t\t\t\t29d 15h 18m`,
};

const TOLERANCE_MIN = 2;
const year = Number(process.argv[2] ?? 2028);

async function spotCheckCity(slug: string, label: string, timeZone: string) {
  const tsv = FIXTURES_2028[slug];
  if (!tsv) return { slug, label, error: 'no fixture' as const };

  const expected = parseTimeAndDateFixture(tsv, year);
  const generated = (await getMajorMoonPhasesAstronomyEngine(year, { timeZone })).map((g) => ({
    phase: g.phase as PhaseName,
    dt: DateTime.fromISO(`${g.date_local}T${g.time_local}:00`, { zone: timeZone }),
  }));

  const worst: Array<{ phase: PhaseName; dateLocal: string; diffMin: number; td: string; ours: string }> = [];
  let maxDiff = 0;
  let phaseFailures = 0;

  for (const event of expected) {
    const exp = toLocalDateTime(event, timeZone);
    const diff = closestPhaseMinutes(exp, generated, event.phase);
    if (diff > maxDiff) maxDiff = diff;
    if (diff > TOLERANCE_MIN) {
      phaseFailures++;
      const match = generated
        .filter((g) => g.phase === event.phase)
        .sort((a, b) => Math.abs(a.dt.diff(exp, 'minutes').minutes) - Math.abs(b.dt.diff(exp, 'minutes').minutes))[0];
      worst.push({
        phase: event.phase,
        dateLocal: event.dateLocal,
        diffMin: diff,
        td: `${event.dateLocal} ${event.timeLocal}`,
        ours: match ? match.dt.toFormat('yyyy-MM-dd HH:mm') : 'none',
      });
    }
  }

  const entries = await generateMoonPhases(presetByLabel(label), `${year}0101`, `${year}1231`, {
    viewHour: DEFAULT_VIEW_HOUR,
  });
  const byDate = new Map(entries.map((e) => [e.date_local, e]));
  const majorMismatches: string[] = [];

  for (const event of expected) {
    const row = byDate.get(event.dateLocal);
    if (!row || row.major_phase !== event.phase) {
      majorMismatches.push(
        `${event.dateLocal} ${event.phase}: got ${row?.major_phase ?? 'missing'}`
      );
    }
  }

  return {
    slug,
    label,
    events: expected.length,
    maxDiffMin: maxDiff,
    phaseFailures,
    worst,
    majorMismatches,
  };
}

async function main() {
console.log(`\n=== Spot check ${year} vs timeanddate (≤${TOLERANCE_MIN} min) ===\n`);

const results = [];
for (const city of CITIES) {
  results.push(await spotCheckCity(city.slug, city.label, city.tz));
}

for (const r of results) {
  if ('error' in r) {
    console.log(`❌ ${r.label}: ${r.error}`);
    continue;
  }
  const ok = r.phaseFailures === 0 && r.majorMismatches.length === 0;
  console.log(
    `${ok ? '✅' : '⚠️'} ${r.label}: ${r.events} phases, max Δ ${r.maxDiffMin.toFixed(1)} min` +
      (r.phaseFailures ? `, ${r.phaseFailures} time failures` : '') +
      (r.majorMismatches.length ? `, ${r.majorMismatches.length} calendar-day mismatches` : '')
  );
  for (const w of r.worst) {
    console.log(`   ↳ ${w.phase} T&D ${w.td} vs ours ${w.ours} (${w.diffMin.toFixed(1)} min)`);
  }
  for (const m of r.majorMismatches.slice(0, 3)) console.log(`   ↳ calendar: ${m}`);
  if (r.majorMismatches.length > 3) console.log(`   ↳ … +${r.majorMismatches.length - 3} more`);
}

const allOk = results.every(
  (r) => !('error' in r) && r.phaseFailures === 0 && r.majorMismatches.length === 0
);
console.log(allOk ? `\nAll cities pass.\n` : `\nSome checks failed.\n`);
process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

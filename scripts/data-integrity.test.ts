import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifiedGroupCapacity, parseSourceDateRange, parseWeeklyCost, seasonFromEvidence, canAgeMissingRecords, recordIdentity, mealsFromEvidence, normalizeUSState } from '../lib/dataIntegrity';
import { scrapeInterchange } from '../lib/scrapers/interchange';
import { scrapeI4Group } from '../lib/scrapers/i4group';
import { enrichForProfile } from '../lib/profile';
import { canonicalEmployer } from '../lib/normalize';
import { scrapeIHappy } from '../lib/scrapers/ihappy';
import { scrapeNewStep } from '../lib/scrapers/newstep';
import { parseAcadexPositions } from '../lib/scrapers/acadex';
import { snapshotEvents } from '../lib/history';
import { ingestScrapedRecords, type RadarStoreData } from '../lib/engine';
import type { CoverageReport, ScrapedJobRecord } from '../lib/types';

test('unknown slots and upper bounds cannot guarantee places for a group', () => {
  assert.equal(verifiedGroupCapacity({ status: 'OPEN', availableSlots: null }), 0);
  assert.equal(verifiedGroupCapacity({ status: 'OPEN', availableSlots: 5, slotType: 'AT_MOST' }), 0);
  assert.equal(verifiedGroupCapacity({ status: 'FULL', availableSlots: 5, slotType: 'EXACT' }), 0);
  assert.equal(verifiedGroupCapacity({ status: 'OPEN', availableSlots: 6, slotType: 'AT_LEAST' }), 6);
});
test('state filters normalize codes but do not turn cities or multi-state text into states', () => {
  assert.equal(normalizeUSState('CA'), 'California');
  assert.equal(normalizeUSState('UTAH'), 'Utah');
  assert.equal(normalizeUSState('New Jersey (NJ)'), 'New Jersey');
  assert.equal(normalizeUSState('ATLANTIC CITY'), undefined);
  assert.equal(normalizeUSState('CA & Zephyr Cove'), undefined);
});
test('ACADEX hyphens inside one position row do not fabricate extra positions for branches', () => {
  const html = '<div><div class="subtitle">Position</div><div class="subtitlelist">- Public Areas Attendant - Jackson Lake Lodge - GTL</div><div class="subtitlelist">- Dishwashers - Jackson Hole</div><div class="subtitlelist">- *นายจ้างพิจารณา</div></div>';
  assert.deepEqual(parseAcadexPositions(html), ['Public Areas Attendant - Jackson Lake Lodge - GTL', 'Dishwashers - Jackson Hole']);
});
test('date objects retain a range without inventing the program year', () => {
  assert.equal(parseSourceDateRange({ start: '05-07', end: '06-15' }), '05-07 – 06-15 (ต้นทางไม่ระบุปี)');
  assert.equal(parseSourceDateRange({ start: null, end: null }), undefined);
  assert.equal(seasonFromEvidence('Summer', '2027-05-07'), 'Summer 2027');
  assert.equal(seasonFromEvidence('Summer'), 'Summer (ไม่ระบุปี)');
});
test('housing preserves decimal units and does not invent a weekly cost or final price', () => {
  assert.equal(parseWeeklyCost('17.15/day'), 120.05);
  assert.equal(parseWeeklyCost('500/Month'), 115.38);
  assert.equal(parseWeeklyCost('$125.50/week'), 125.5);
  assert.equal(parseWeeklyCost('$500 deposit'), undefined);
  assert.equal(parseWeeklyCost('2027 fees not finalized. In 2026 $120/week'), undefined);
});

test('a housing fee before included meals does not become a separate meal charge', () => {
  assert.equal(mealsFromEvidence('$100+tax /week/person + Includes meals'), true);
  assert.equal(mealsFromEvidence('3 meals served daily are provided for $115 per week'), false);
  assert.equal(mealsFromEvidence('Housing provided'), undefined);
});
test('failed, partial or anomalous crawls never age missing jobs', () => {
  const ok = { status: 'SUCCESS', failedPages: 0, coveragePct: 100, discoveryCoveragePct: 100 };
  assert.equal(canAgeMissingRecords(ok), true);
  assert.equal(canAgeMissingRecords({ ...ok, status: 'ERROR' }), false);
  assert.equal(canAgeMissingRecords({ ...ok, failedPages: 1 }), false);
  assert.equal(canAgeMissingRecords({ ...ok, discoveryCoveragePct: 20 }), false);
  assert.equal(canAgeMissingRecords({ ...ok, anomalyWarning: 'index drop' }), false);
});
test('same employer in different cities and different offers keeps distinct identities', () => {
  assert.notEqual(canonicalEmployer('McDonalds', 'Boston', 'MA').id, canonicalEmployer('McDonalds', 'Salem', 'MA').id);
  const base = { agency: 'ACADEX', employer: 'Lodge', season: 'Summer 2027', city: 'Town', state: 'UT' };
  assert.notEqual(recordIdentity({ ...base, sourceUrl: 'https://example.com/group-a' }), recordIdentity({ ...base, sourceUrl: 'https://example.com/group-b' }));
});
test('profile scores preserve explicit zero values and never supply source location or English', () => {
  const j = enrichForProfile({ id: 'test', agency: 'test', employer: 'Lake Tahoe', season: 'unknown', status: 'FULL', sourceUrl: 'https://example.com', lastSeenAt: '2026-10-04', employerFit: 0, socialFit: 0, natureFit: 0, secondJobFit: 0, valueFit: 0, group3Fit: 0 });
  assert.equal(j.fitScore, 0);
  assert.equal(j.state, undefined);
  assert.equal(j.englishFit, undefined);
});
test('I4 connector without a public job index never publishes hardcoded jobs', async () => {
  for (const scrape of [scrapeI4Group]) {
    const result = await scrape();
    assert.equal(result.records.length, 0);
    assert.equal(result.report.connectorType, 'TBD');
    assert.equal(result.report.coveragePct, 0);
    assert.equal(result.report.status, 'ERROR');
  }
});

test('iHappy reads row year and Full icon, rather than treating old full jobs as open 2027', async () => {
  const row = (year: number, icon: string) => `<tr>${['<img src=" https://example.com/' + icon + ' ">', '', '', '', `Premium Summer Job ${year}`, 'Test Lodge', 'Town', 'Utah', 'Housekeeper', '$15.50 per hour', '<a href=" https://example.com/offer ">Detail</a>'].map((value, index) => `<td class="column-${index + 1}">${value}</td>`).join('')}</tr>`;
  const { records } = await scrapeIHappy(`<table class="tablepress"><tbody>${row(2026, 'Full-1.png')}${row(2027, 'Full-1.png')}</tbody></table>`);
  assert.equal(records.length, 1);
  assert.equal(records[0].season, 'Summer 2027');
  assert.equal(records[0].position.status, 'FULL');
  assert.equal(records[0].position.availableSlots, 0);
  assert.equal(records[0].sourceUrl, 'https://example.com/offer');
  assert.equal(records[0].position.englishLevel, undefined);
});

test('history emits observed values and distinct wage and housing changes', () => {
  const snapshots = [
    { positionId: 'p', status: 'FULL' as const, availableSlots: 0, wageHourly: 15, capturedAt: '2026-01-01' },
    { positionId: 'p', status: 'OPEN' as const, availableSlots: 5, wageHourly: 17, capturedAt: '2026-01-02' },
  ];
  const events = snapshotEvents(snapshots);
  assert.equal(events[0].eventType, 'NEW_JOB');
  assert.equal(events[0].beforeValue, undefined);
  assert.deepEqual(events.slice(1).map(e => e.eventType), ['STATUS_CHANGE', 'SLOT_CHANGE', 'WAGE_CHANGE']);
  assert.equal(events.at(-1)?.beforeValue, '15');
  assert.equal(snapshotEvents(snapshots.map(s => ({ ...s, baseline: true }))).length, 0);
});

test('New Step FULL employer overrides positive opening caps but preserves the raw text', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    const detail = String(input).includes('/findOne');
    const employer = { id: 1, name: 'Test Lodge', slug: 'test-lodge', seasonType: 'SUMMER', isActive: true, statusOfEmployers: 'เต็ม', startSummer: { start: '05-07', end: '06-15' }, jobs: [{ id: 2, tag: { name: 'Dishwasher' }, compensation: '15', numberOfOpenings: 'ไม่เกิน 5 คน', statusOfJob: 'เปิดรับสมัคร', isActive: true }] };
    return new Response(JSON.stringify({ data: detail ? employer : [employer] }), { headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const { records } = await scrapeNewStep();
    assert.equal(records.length, 1);
    assert.equal(records[0].position.status, 'FULL');
    assert.equal(records[0].position.availableSlots, 0);
    assert.equal(records[0].position.slotType, 'FULL');
    assert.equal(records[0].position.rawSlotText, 'ไม่เกิน 5 คน');
    assert.equal(records[0].position.availabilityText, 'เต็ม (สถานะต้นทาง)');
  } finally { globalThis.fetch = originalFetch; }
});

test('ingestion failure preserves old jobs and distinct offer groups preserve hours/meals', async () => {
  const store: RadarStoreData = { employers: {}, agencyEmployers: {}, positions: {}, housing: {}, snapshots: [], syncRuns: [], sourceHealth: {}, discoveredUrls: {}, lastUpdated: '' };
  const record: ScrapedJobRecord = { agency: 'Test', employer: 'Lodge', city: 'Town', state: 'UT', season: 'Summer 2027', sourceUrl: 'https://example.com/group-a', scrapedAt: '2026-10-04', position: { name: 'Cook', wageHourly: 17, hoursText: '32-40', availableSlots: 4, slotType: 'EXACT', status: 'OPEN' }, housing: { housingText: 'No meals included', mealsIncluded: false } };
  const report = { agency: 'Test', status: 'SUCCESS', connectorType: 'HTML', failedPages: 0, failedUrls: [], coveragePct: 100, discoveryCoveragePct: 100, parseCoveragePct: 100, durationMs: 0, employersFound: 2 } as unknown as CoverageReport;
  await ingestScrapedRecords([record, { ...record, sourceUrl: 'https://example.com/group-b' }], report, { store, persist: false, syncRemote: false });
  assert.equal(Object.keys(store.positions).length, 2);
  for (let i = 0; i < 4; i++) await ingestScrapedRecords([], { ...report, status: 'ERROR', failedPages: 1, coveragePct: 0 }, { store, persist: false, syncRemote: false });
  assert.ok(Object.values(store.positions).every(p => !p.isStale && p.missingRuns === 0));
  assert.equal(Object.values(store.positions)[0].hoursText, '32-40');
  assert.equal(Object.values(store.positions)[0].lastSeenAt, '2026-10-04');
  assert.equal(Object.values(store.housing)[0].mealsIncluded, false);
});

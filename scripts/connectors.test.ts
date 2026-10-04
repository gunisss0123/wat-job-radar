import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseAcadexAvailability } from '../lib/scrapers/acadex';
import { parseInterchangeJob } from '../lib/scrapers/interchange';

test('ACADEX reads index-card availability, including lower bounds and full', () => {
  const html = `<div class="bottom_listdetail"><a href="/location/one/"></a><div class="program_bot_available">9+</div></div><div class="bottom_listdetail"><a href="/location/two/"></a><div class="program_bot_available">0</div></div>`;
  const cards = parseAcadexAvailability(html);
  assert.equal(cards.get('https://www.acadexthailand.com/location/one/')?.slotType, 'AT_LEAST');
  assert.equal(cards.get('https://www.acadexthailand.com/location/one/')?.slots, 9);
  assert.equal(cards.get('https://www.acadexthailand.com/location/two/')?.status, 'FULL');
  const soon = parseAcadexAvailability('<div class="bottom_listdetail"><a href="/location/soon/"></a><div class="bottom_listdetail_bo2">เร็วๆ นี้</div></div>');
  assert.equal(soon.get('https://www.acadexthailand.com/location/soon/')?.status, 'COMING_SOON');
});

test('Interchange parses real feature table without treating overtime as job status or inventing year', () => {
  const html = fs.readFileSync('data/connector-evidence/itcjob.html', 'utf8');
  const record = parseInterchangeJob(html, 'https://www.interchange-th.com/workandtravel/jobs/trishs-chocolate/')[0];
  assert.equal(record.employer, 'Trish’s Chocolate');
  assert.equal(record.position.wageHourly, 19.5);
  assert.equal(record.position.availableSlots, 5);
  assert.equal(record.position.status, 'OPEN');
  assert.equal(record.position.name, 'Store Associate');
  assert.equal(record.season, 'Summer (ไม่ระบุปี)');
  const withoutStatus = html.replace(/<tr><td>Status<\/td><td>Available\s*<\/td><\/tr>/, '');
  assert.equal(parseInterchangeJob(withoutStatus, record.sourceUrl)[0].position.status, 'UNKNOWN');
  assert.equal(parseInterchangeJob(withoutStatus, record.sourceUrl)[0].position.availableSlots, null);
});

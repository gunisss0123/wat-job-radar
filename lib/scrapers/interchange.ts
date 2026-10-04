import * as cheerio from 'cheerio';
import type { CoverageReport, ScrapedJobRecord } from '../types';
import { getHtml } from './common';
import { categorizePosition } from '../normalize';
import { parseWeeklyCost, normalizeUSState } from '../dataIntegrity';
// Linked by the official interchangethailand.com Spring/Summer job announcements.
const BASE = 'https://www.interchange-th.com/workandtravel/';
export function parseInterchangeJob(html: string, url: string): ScrapedJobRecord[] {
  const $ = cheerio.load(html), fields: Record<string, string> = {};
  $('table tr').each((_, row) => { const cells = $(row).find('td'); if (cells.length === 2) fields[cells.eq(0).text().trim()] = cells.eq(1).text().trim(); });
  const employer = $('.job-title').first().text().trim();
  if (!employer || !fields.Position) return [];
  const wageText = fields['Rate / Hour'];
  const wages = [...(wageText || '').matchAll(/\$\s*(\d+(?:\.\d+)?)/g)].map(m => Number(m[1]));
  const statusText = fields.Status || '';
  const full = /^(full|closed|sold\s*out|not available)$/i.test(statusText);
  const open = /^(available|open)$/i.test(statusText);
  // Quantity is not remaining capacity without an explicit Available status.
  const quantity = /^\d+$/.test(fields.Quantity || '') ? Number(fields.Quantity) : null;
  const slots = full ? 0 : open ? quantity : null;
  const category = fields['Job Category'] || '';
  const year = (fields['Start Date – End Date'] || '').match(/\b202\d\b/)?.[0];
  const seasons = ['Spring', 'Summer'].filter(s => category.includes(s));
  return (seasons.length ? seasons : ['Work & Travel']).map(season => ({
    agency: 'Interchange', employer, sourceId: url,
    season: year ? `${season} ${year}` : `${season} (ไม่ระบุปี)`,
    state: normalizeUSState($('.job-location').first().text().trim()),
    locationRaw: $('.job-location').first().text().trim(),
    startDateText: fields['Start Date – End Date'],
    sourceNotes: 'Interchange Thailand · รายการจากเว็บที่เว็บไซต์ทางการลิงก์ไปให้ · ไม่ยืนยันปีโครงการหากวันที่ไม่ระบุปี',
    sourceUrl: url, scrapedAt: new Date().toISOString(),
    imageUrl: $('.company-logo img').first().attr('data-src') || $('.company-logo img').first().attr('src'),
    housing: { housingText: fields.Housing, weeklyCost: parseWeeklyCost(fields.Housing) },
    position: {
      name: fields.Position, category: categorizePosition(fields.Position),
      wageHourly: wages[0], wageMax: wages.length > 1 ? wages[1] : wages[0], wageText,
      englishLevel: fields.Skills, availableSlots: slots,
      slotType: full ? 'FULL' : slots != null ? 'EXACT' : 'UNKNOWN',
      rawSlotText: fields.Quantity, availabilityText: statusText || 'ไม่ระบุสถานะที่ว่าง',
      status: full ? 'FULL' : open ? slots != null && slots < 3 ? 'LIMITED' : 'OPEN' : 'UNKNOWN',
    },
  }));
}
export async function scrapeInterchange(): Promise<{ records: ScrapedJobRecord[]; report: CoverageReport }> {
  const started = Date.now(), failedUrls: { url: string; error: string }[] = [];
  const urls = new Set<string>(), indexes = new Set([BASE + 'spring/', BASE + 'summer/']);
  for (const url of indexes) {
    try {
      const $ = cheerio.load(await getHtml(url));
      $('a[href]').each((_, a) => {
        const href = $(a).attr('href')!;
        if (href.startsWith(BASE + 'jobs/')) urls.add(href);
        if (href.startsWith(BASE) && /[?&]paged=\d+/.test(href)) indexes.add(href);
      });
    } catch (e) { failedUrls.push({ url, error: String(e) }); }
  }
  const records: ScrapedJobRecord[] = [], details = [...urls]; let parsed = 0;
  for (let i = 0; i < details.length; i += 6) {
    await Promise.all(details.slice(i, i + 6).map(async url => {
      try { const rows = parseInterchangeJob(await getHtml(url), url); if (!rows.length) throw Error('Missing job feature table'); records.push(...rows); parsed++; }
      catch (e) { failedUrls.push({ url, error: String(e) }); }
    }));
  }
  const coverage = details.length ? parsed / details.length * 100 : 0;
  return { records, report: {
    agency: 'Interchange', connectorType: 'HTML', season: 'Spring / Summer (ปีตามต้นฉบับ)',
    indexPagesDiscovered: indexes.size, jobUrlsFound: details.length, uniqueJobUrls: details.length, duplicateUrls: 0,
    employersFound: new Set(records.map(r => r.employer)).size,
    detailPagesFetched: details.length, detailPagesParsed: parsed, positionsFound: records.length, positionsSaved: records.length,
    failedPages: failedUrls.length, failedUrls, discoveryCoveragePct: failedUrls.length ? 0 : 100, parseCoveragePct: coverage, coveragePct: coverage,
    slotTypes: { exactNumeric: records.filter(r => r.position.slotType === 'EXACT').length, moreThanX: 0, upToX: 0, full: records.filter(r => r.position.status === 'FULL').length, unknown: records.filter(r => r.position.slotType === 'UNKNOWN').length },
    durationMs: Date.now() - started, status: failedUrls.length || !records.length ? 'WARNING' : 'SUCCESS',
  } };
}

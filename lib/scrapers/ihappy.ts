import * as cheerio from 'cheerio';
import type {
  CoverageReport,
  ScrapedJobRecord,
  JobStatus,
  SlotSemanticType,
  SlotTypeStats,
  FailedUrlItem
} from '../types';
import { categorizePosition } from '../normalize';

const IHAPPY_SUMMER_URL = 'https://ihappyeducation.com/job-location-summer/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchHtml(url: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'th,en-US;q=0.9,en;q=0.8'
        },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

export async function scrapeIHappy(sourceHtml?: string): Promise<{
  records: ScrapedJobRecord[];
  report: CoverageReport;
}> {
  const startTime = Date.now();
  const failedUrls: FailedUrlItem[] = [];
  const records: ScrapedJobRecord[] = [];

  const slotTypes: SlotTypeStats = {
    exactNumeric: 0,
    moreThanX: 0,
    upToX: 0,
    full: 0,
    unknown: 0
  };

  let html = '';
  try {
    html = sourceHtml ?? await fetchHtml(IHAPPY_SUMMER_URL);
  } catch (err: any) {
    failedUrls.push({ url: IHAPPY_SUMMER_URL, error: err.message });
    return {
      records: [],
      report: {
        agency: 'iHappy',
        connectorType: 'HTML',
        season: 'Summer 2027',
        indexPagesDiscovered: 0,
        jobUrlsFound: 0,
        uniqueJobUrls: 0,
        duplicateUrls: 0,
        employersFound: 0,
        detailPagesFetched: 0,
        detailPagesParsed: 0,
        positionsFound: 0,
        positionsSaved: 0,
        failedPages: 1,
        failedUrls,
        discoveryCoveragePct: 0,
        parseCoveragePct: 0,
        coveragePct: 0,
        slotTypes,
        durationMs: Date.now() - startTime,
        status: 'ERROR'
      }
    };
  }

  const $ = cheerio.load(html);
  const rows = $('table.tablepress tbody tr');
  const totalFound = rows.length;

  rows.each((i, row) => {
    try {
      const $r = $(row);
      const cols = $r.find('td');
      if (cols.length < 9) return;

      const seasonText = $r.find('.column-5').text().trim();
      if (!/Summer.*2027/i.test(seasonText)) return;
      const statusImg = ($r.find('.column-1 img').attr('src') || '').trim();
      const isFull = /(?:full|not-available|closed)[^/]*\.png/i.test(statusImg);
      const isAvailable = !isFull && /\/available[^/]*\.png/i.test(statusImg);

      const logoImg = $r.find('.column-4 img').attr('src')?.trim() || '';
      const employerName = $r.find('.column-6').text().trim();
      if (!employerName) return;

      const city = $r.find('.column-7').text().trim();
      const state = $r.find('.column-8').text().trim();

      const posCol = $r.find('.column-9');
      const posText = posCol.text().trim();

      let posName = posText;
      let availSlots: number | null = null;
      let slotType: SlotSemanticType = 'UNKNOWN';
      let rawSlotText = 'ไม่ระบุ';

      const slotMatch = posText.match(/(\d+)\s*(?:positions?|ตำแหน่ง|ที่)/i);
      if (slotMatch) {
        availSlots = Number(slotMatch[1]);
        if (availSlots === 0) {
          slotType = 'FULL';
          slotTypes.full++;
        } else {
          slotType = 'EXACT';
          slotTypes.exactNumeric++;
        }
        rawSlotText = `${availSlots} ตำแหน่ง`;
        posName = posText.replace(/\d+\s*(?:positions?|ตำแหน่ง|ที่).*/i, '').trim();
      } else {
        slotTypes.unknown++;
      }

      const rateText = $r.find('.column-10').text().trim();
      const wageMatch = rateText.match(/(\d+(?:\.\d+)?)/);
      const wageHourly = wageMatch ? Number(wageMatch[1]) : undefined;
      const tipsIncluded = /tips/i.test(rateText);

      const detailLink = ($r.find('.column-11 a').attr('href') || IHAPPY_SUMMER_URL).trim();

      let status: JobStatus = isFull || availSlots === 0 ? 'FULL' : isAvailable ? 'OPEN' : 'UNKNOWN';
      if (status === 'FULL') { availSlots = 0; slotType = 'FULL'; }
      if (status === 'OPEN' && availSlots != null && availSlots <= 2) {
        status = 'LOW_SLOTS';
      }

      records.push({
        agency: 'iHappy',
        employer: employerName,
        sourceId: `ihappy-${employerName}-${city}-${state}-${posName}`,
        city,
        state,
        season: 'Summer 2027',
        locationRaw: `${city}, ${state}`.trim(),
        position: {
          name: posName || 'Staff',
          category: categorizePosition(posName),
          wageHourly,
          wageText: rateText || undefined,
          tips: tipsIncluded,
          availableSlots: availSlots,
          slotType,
          rawSlotText,
          availabilityText: availSlots != null ? `${availSlots} ตำแหน่ง` : (isAvailable ? 'เปิดรับ' : 'เต็ม'),
          englishLevel: undefined,
          status
        },
        housing: {
          housingText: undefined
        },
        sourceUrl: detailLink,
        imageUrl: logoImg,
        scrapedAt: new Date().toISOString()
      });
    } catch (err: any) {
      failedUrls.push({ url: `${IHAPPY_SUMMER_URL}#row-${i}`, error: err.message });
    }
  });

  const durationMs = Date.now() - startTime;
  const report: CoverageReport = {
    agency: 'iHappy',
    connectorType: 'HTML',
    season: 'Summer 2027',
    indexPagesDiscovered: 1,
    jobUrlsFound: totalFound,
    uniqueJobUrls: records.length,
    duplicateUrls: 0,
    employersFound: new Set(records.map(r => `${r.employer}|${r.city}|${r.state}`)).size,
    detailPagesFetched: 1,
    detailPagesParsed: 1,
    positionsFound: records.length,
    positionsSaved: 0,
    failedPages: failedUrls.length,
    failedUrls,
    discoveryCoveragePct: 100,
    parseCoveragePct: 100,
    coveragePct: 100,
    slotTypes,
    durationMs,
    status: failedUrls.length === 0 ? 'SUCCESS' : 'WARNING'
  };

  return { records, report };
}

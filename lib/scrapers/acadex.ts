import * as cheerio from 'cheerio';
import type {
  CoverageReport,
  ScrapedJobRecord,
  Job,
  JobStatus,
  SlotSemanticType,
  SlotTypeStats,
  FailedUrlItem
} from '../types';
import { categorizePosition, cleanEmployerName } from '../normalize';
import { absolute, uniq, stateFromCode, statusFrom, baseJob } from './common';
import { slug } from '../common';
import { parseWeeklyCost, mealsFromEvidence } from '../dataIntegrity';

const ACADEX_LIST_URL = 'https://www.acadexthailand.com/program/work-and-travel-summer/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export function parseAcadexAvailability(html: string) {
  const $ = cheerio.load(html);
  const result = new Map<string, { slots: number | null; slotType: SlotSemanticType; status: JobStatus; text: string }>();
  $('.bottom_listdetail').each((_, card) => {
    const href = $(card).find('a[href*="/location/"]').first().attr('href');
    const text = $(card).find('.program_bot_available').text().trim();
    if (!href || !text) return;
    const match = text.match(/^(\d+)\s*(\+)?$/);
    const full = /^(full|sold\s*out|เต็ม)$/i.test(text);
    const slots = full ? 0 : match ? Number(match[1]) : null;
    const slotType: SlotSemanticType = slots === 0 ? 'FULL' : match?.[2] ? 'AT_LEAST' : match ? 'EXACT' : 'UNKNOWN';
    const status: JobStatus = slots === 0 ? 'FULL' : slots != null ? slots < 3 ? 'LIMITED' : 'OPEN' : 'UNKNOWN';
    result.set(absolute(ACADEX_LIST_URL, href).replace(/\/$/, '') + '/', { slots, slotType, status, text });
  });
  return result;
}

export function parseAcadexPositions(html: string): string[] {
  const $ = cheerio.load(html);
  const section = $('.subtitle').filter((_, e) => $(e).text().trim() === 'Position').first().parent();
  return [...new Set(section.find('.subtitlelist').map((_, e) => $(e).text().replace(/^\s*-\s*/, '').replace(/\s+/g, ' ').trim()).get().filter(s => s && !/[\u0E00-\u0E7F]/.test(s) && !/^\*+$/.test(s)))];
}

async function fetchHtml(url: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18000);
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
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

function parseWeeklyHousing(text?: string): number | undefined {
  if (!text) return undefined;
  const cleaned = text.replace(/,/g, '');
  const m = cleaned.match(/\$\s*(\d+(?:\.\d+)?)(?:\s*\+\s*tax)?\s*(?:\/|per\s*)?(week|wk|day|month)/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  return unit === 'day' ? n * 7 : unit === 'month' ? (n * 12) / 52 : n;
}

export async function scrapeAcadex(limit = 400): Promise<{
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

  let listHtml = '';
  try {
    listHtml = await fetchHtml(ACADEX_LIST_URL);
  } catch (err: any) {
    failedUrls.push({ url: ACADEX_LIST_URL, error: err.message });
    return {
      records: [],
      report: {
        agency: 'ACADEX',
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

  const $ = cheerio.load(listHtml);
  const indexAvailability = parseAcadexAvailability(listHtml);
  const rawUrls: string[] = [];

  $('a[href*="/location/"]').each((_, a) => {
    const href = $(a).attr('href');
    if (href) {
      const full = absolute(ACADEX_LIST_URL, href).replace(/\/$/, '') + '/';
      rawUrls.push(full);
    }
  });

  const uniqueUrls = uniq(rawUrls).slice(0, limit);
  console.log(`[ACADEX] Discovered ${rawUrls.length} links -> ${uniqueUrls.length} unique location URLs`);

  const concurrency = 8;
  const total = uniqueUrls.length;
  let processed = 0;

  for (let i = 0; i < total; i += concurrency) {
    const chunk = uniqueUrls.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (url) => {
        try {
          const pageHtml = await fetchHtml(url);
          const $$ = cheerio.load(pageHtml);
          const body = $$('body').text().replace(/\s+/g, ' ').trim();

          // Title & Employer
          const titleRaw =
            $$('.location_title').text().trim() ||
            $$('title').text().replace(/– Acadex Thailand.*$/i, '').trim();

          const locationRaw = $$('.name_location').text().trim();
          const locParts = locationRaw.split(',').map((s) => s.trim()).filter(Boolean);
          const city = locParts[0] || undefined;
          let state = locParts[locParts.length - 1] || undefined;
          if (state) state = stateFromCode(state) || state;

          const employer = cleanEmployerName(
            titleRaw
              .replace(/\s*\([A-Za-z0-9\s:,-]*Summer 2027[A-Za-z0-9\s:,-]*\)/i, '')
              .replace(/,\s*[A-Za-z\s]+$/i, '')
          ) || 'ACADEX Employer';

          // Wage
          const wageMatch = body.match(/Rate\s*[:：-]?\s*\$?([\d.]+)(?:\s*[-–]\s*\$?([\d.]+))?\s*(?:per\s*hour|\/hr|\/hour)?/i);
          const wageHourly = wageMatch ? Number(wageMatch[1]) : undefined;
          const wageMax = wageMatch && wageMatch[2] ? Number(wageMatch[2]) : wageHourly;
          const wageText = wageHourly
            ? `$${wageHourly.toFixed(2)}${wageMax && wageMax !== wageHourly ? `–$${wageMax.toFixed(2)}` : ''}/hr`
            : undefined;

          // Hours
          const hoursMatch = body.match(/Hours\s*(Average\s*[\d.]+\s*[-–]\s*[\d.]+\s*hours per week)/i);
          const hoursText = hoursMatch ? hoursMatch[1] : undefined;

          // Dates
          const startMatch = body.match(/Start Date\s*([^]{1,90}?)(?=End Date)/i);
          const endMatch = body.match(/End Date\s*([^]{1,90}?)(?=Remark|Housing|\*)/i);
          const startDateText = startMatch ? startMatch[1].trim() : undefined;
          const endDateText = endMatch ? endMatch[1].trim() : undefined;

          // Housing
          const housingMatch = body.match(/Housing Information\s*([^]{1,2500}?)(?=Housing Deposit|Transportation to work|State)/i);
          const housingText = housingMatch ? housingMatch[1].trim() : undefined;
          const weeklyCost = /202[0-6]|not finali[sz]ed|TBA|TBD|To be announced/i.test(housingText || '') ? undefined : parseWeeklyCost(housingText);
          const depositMatch = body.match(/Housing Deposit Required\s*\$?(\d+)/i);
          const deposit = depositMatch ? Number(depositMatch[1]) : undefined;

          // Availability / Slots
          let slots: number | null = null;
          let status: JobStatus = 'UNKNOWN';
          const availMatch = body.match(/Available\s*(\d+)/i);
          if (availMatch) {
            slots = Number(availMatch[1]);
            status = slots === 0 ? 'FULL' : slots < 3 ? 'LIMITED' : 'OPEN';
            slotTypes.exactNumeric++;
          } else if (/\bเต็ม\b|sold\s*out|available\s*:\s*0/i.test(body)) {
            slots = 0;
            status = 'FULL';
            slotTypes.full++;
          } else {
            slotTypes.unknown++;
          }

          // Positions
          const sourcePositions = parseAcadexPositions(pageHtml);
          const positions = sourcePositions.length ? sourcePositions : ['ตำแหน่งยังไม่ระบุ'];
          const cardAvailability = indexAvailability.get(url);
          if (cardAvailability) status = cardAvailability.status;

          // Image
          let imageUrl: string | undefined;
          $$('img').each((_, img) => {
            const src = $$(img).attr('src');
            if (
              src &&
              /wp-content\/uploads\/\d{4}\/\d{2}\/.*\.(jpg|jpeg|png|webp)/i.test(src) &&
              !/logo|icon|out\.png|location1\.png|detail-image|program-detail|face|tweet|line|fb|ig|tiktok|x\.png/i.test(src)
            ) {
              if (!imageUrl) imageUrl = src;
            }
          });

          for (const p of positions) {
            records.push({
              agency: 'ACADEX',
              sourceId: url,
              sourceNotes: `ค่าแรงเป็นช่วงของประกาศรวม ไม่ได้ยืนยันอัตรารายตำแหน่ง${cardAvailability ? ` · หน้ารวมงานระบุ Available ${cardAvailability.text} สำหรับประกาศรวม ไม่ใช่จำนวนแยกแต่ละตำแหน่ง` : ''}${/202[0-6]|not finali[sz]ed|TBA|TBD/i.test(housingText || '') ? ' · ข้อมูลที่พักอ้างอิงปีก่อนหรือรอยืนยัน ไม่ใช้เป็นราคาที่พักปี 2027' : ''}`,
              employer,
              city,
              state,
              season: /2027/.test(url + titleRaw) ? 'Summer 2027' : 'Summer (ไม่ระบุปี)',
              startDateText,
              endDateText,
              locationRaw,
              imageUrl,
              sourceUrl: url,
              scrapedAt: new Date().toISOString(),
              housing: {
                weeklyCost,
                housingText,
                deposit,
                mealsIncluded: mealsFromEvidence(housingText)
              },
              position: {
                name: p,
                category: categorizePosition(p),
                wageHourly,
                wageMax,
                wageText,
                hoursText,
                availableSlots: cardAvailability ? cardAvailability.slots === 0 ? 0 : positions.length === 1 ? cardAvailability.slots : null : slots,
                slotType: cardAvailability ? positions.length === 1 || cardAvailability.slots === 0 ? cardAvailability.slotType : 'UNKNOWN' : slots === 0 ? 'FULL' : slots != null ? 'EXACT' : 'UNKNOWN',
                rawSlotText: cardAvailability?.text,
                availabilityText: cardAvailability ? `Available ${cardAvailability.text} (รวมประกาศ)` : undefined,
                status
              }
            });
          }
        } catch (err: any) {
          failedUrls.push({ url, error: err.message });
        }
      })
    );

    processed += chunk.length;
    if (processed % 40 === 0 || processed === total) {
      console.log(`[ACADEX] Progress: ${processed}/${total} pages processed (${records.length} positions captured)`);
    }
  }

  const employersFound = new Set(records.map((r) => r.employer)).size;

  const report: CoverageReport = {
    agency: 'ACADEX',
    connectorType: 'HTML',
    season: 'Summer 2027',
    indexPagesDiscovered: 1,
    jobUrlsFound: rawUrls.length,
    uniqueJobUrls: uniqueUrls.length,
    duplicateUrls: rawUrls.length - uniqueUrls.length,
    employersFound,
    detailPagesFetched: uniqueUrls.length,
    detailPagesParsed: uniqueUrls.length - failedUrls.length,
    positionsFound: records.length,
    positionsSaved: records.length,
    failedPages: failedUrls.length,
    failedUrls,
    discoveryCoveragePct: uniq(rawUrls).length ? uniqueUrls.length / uniq(rawUrls).length * 100 : 0,
    parseCoveragePct: uniqueUrls.length > 0 ? ((uniqueUrls.length - failedUrls.length) / uniqueUrls.length) * 100 : 0,
    coveragePct: uniqueUrls.length > 0 ? ((uniqueUrls.length - failedUrls.length) / uniqueUrls.length) * 100 : 0,
    slotTypes,
    durationMs: Date.now() - startTime,
    status: failedUrls.length === 0 ? 'SUCCESS' : 'WARNING'
  };

  return { records, report };
}

// Backward compatibility helper
export async function scrapeAcadexLegacy(limit = 400): Promise<Job[]> {
  const { records } = await scrapeAcadex(limit);
  return records.map((r) =>
    baseJob({
      id: `acadex-${slug(r.employer)}-${slug(r.position.name)}`,
      agency: 'ACADEX',
      employer: r.employer,
      city: r.city,
      state: r.state,
      position: r.position.name,
      category: r.position.category,
      wageMin: r.position.wageHourly,
      wageMax: r.position.wageMax,
      wageText: r.position.wageText,
      housingWeekly: r.housing?.weeklyCost,
      housingText: r.housing?.housingText,
      mealsIncluded: r.housing?.mealsIncluded,
      availableSlots: r.position.availableSlots,
      status: r.position.status,
      startText: r.startDateText,
      endText: r.endDateText,
      sourceUrl: r.sourceUrl,
      imageUrl: r.imageUrl,
      lastSeenAt: r.scrapedAt
    })
  );
}

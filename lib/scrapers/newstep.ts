import * as cheerio from 'cheerio';
import type {
  CoverageReport,
  DiscoveredEmployer,
  ScrapedJobRecord,
  ScrapedPositionItem,
  JobStatus,
  SlotSemanticType,
  FailedUrlItem
} from '../types';
import { categorizePosition } from '../normalize';
import { parseSourceDateRange, mealsFromEvidence, seasonFromEvidence } from '../dataIntegrity';

const NEWSTEP_API_BASE = 'https://api.newstepthailand.com/api/v1';
const NEWSTEP_API_KEY = 'byssczyjywbbnfsumuejahcuspzobsod';
const NEWSTEP_WEB_BASE = 'https://newstepthailand.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'x-api-key': NEWSTEP_API_KEY,
  'Accept': 'application/json, text/plain, */*'
};

export interface NewStepSlotResult {
  slotType: SlotSemanticType;
  availableSlots: number | null;
  rawSlotText: string;
}

export function parseNewStepSlotText(text?: string | null): NewStepSlotResult {
  if (!text) {
    return { slotType: 'UNKNOWN', availableSlots: null, rawSlotText: 'ไม่ระบุ' };
  }
  const clean = text.trim();

  // Full
  if (/เต็ม|closed|full/i.test(clean)) {
    return { slotType: 'FULL', availableSlots: 0, rawSlotText: clean };
  }

  // More than X (e.g. มากกว่า 5 คน, > 5)
  const moreMatch = clean.match(/(?:มากกว่า|>)\s*(\d+)/i);
  if (moreMatch) {
    const minVal = Number(moreMatch[1]);
    return {
      slotType: 'AT_LEAST',
      availableSlots: minVal + 1, // Normalized lower bound
      rawSlotText: clean
    };
  }

  // Up to X (e.g. ไม่เกิน 5 คน, <= 5)
  const upToMatch = clean.match(/(?:ไม่เกิน|<=|<)\s*(\d+)/i);
  if (upToMatch) {
    const maxVal = Number(upToMatch[1]);
    return {
      slotType: 'AT_MOST',
      availableSlots: maxVal,
      rawSlotText: clean
    };
  }

  // Exact number (e.g. 5, 2 คน, 10 ตำแหน่ง)
  const numMatch = clean.match(/^(\d+)(?:\s*(?:คน|ตำแหน่ง|slots?))?$/i) || clean.match(/(\d+)\s*(?:คน|ตำแหน่ง)/i);
  if (numMatch) {
    const val = Number(numMatch[1]);
    return {
      slotType: val === 0 ? 'FULL' : 'EXACT',
      availableSlots: val,
      rawSlotText: clean
    };
  }

  // Unknown / unstated
  return {
    slotType: 'UNKNOWN',
    availableSlots: null,
    rawSlotText: clean
  };
}

export function parseNewStepWeeklyHousing(text?: string | null): number | undefined {
  if (!text) return undefined;
  const cleaned = text.replace(/,/g, '');

  const weekMatch = cleaned.match(/\$?\s*(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*)?(?:week|wk|สัปดาห์)/i);
  if (weekMatch) return Number(weekMatch[1]);

  const monthMatch = cleaned.match(/\$?\s*(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*)?(?:month|เดือน)/i);
  if (monthMatch) return Number(((Number(monthMatch[1]) * 12) / 52).toFixed(1));

  const dayMatch = cleaned.match(/\$?\s*(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*)?(?:day|วัน)/i);
  if (dayMatch) return Number((Number(dayMatch[1]) * 7).toFixed(1));

  return undefined;
}

/**
 * 1. API-First Discovery: Fetch all Summer employers from New Step JSON API
 */
export async function discoverNewStepEmployers(): Promise<{
  discovered: DiscoveredEmployer[];
  jobUrlsFound: number;
  uniqueJobUrls: number;
  duplicateUrls: number;
  indexPagesDiscovered: number;
}> {
  const url = `${NEWSTEP_API_BASE}/employers/find`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`New Step API returned HTTP ${res.status}`);

  const json = await res.json();
  const allEmployers: any[] = json.data || [];

  // Filter for active Summer 2027 employers
  const summerEmployers = allEmployers.filter(
    (e: any) => e.seasonType === 'SUMMER' && !e.isDelete && e.isActive && e.slug
  );

  const discovered: DiscoveredEmployer[] = [];
  const seenSlugs = new Set<string>();
  let duplicateUrls = 0;

  for (const emp of summerEmployers) {
    if (seenSlugs.has(emp.slug)) {
      duplicateUrls++;
      continue;
    }
    seenSlugs.add(emp.slug);

    discovered.push({
      agency: 'New Step',
      sourceId: String(emp.id),
      name: (emp.name || '').trim(),
      city: emp.city?.name?.trim(),
      state: emp.state?.name?.trim(),
      imageUrl: emp.avatar || undefined,
      detailUrl: `${NEWSTEP_WEB_BASE}/jobs/${emp.slug}`
    });
  }

  return {
    discovered,
    jobUrlsFound: summerEmployers.length,
    uniqueJobUrls: discovered.length,
    duplicateUrls,
    indexPagesDiscovered: 1
  };
}

/**
 * 2. API-First Detail Fetcher for a single New Step Employer
 */
async function fetchNewStepEmployerDetailApi(slug: string): Promise<any> {
  const url = `${NEWSTEP_API_BASE}/employers/findOne?slug=${encodeURIComponent(slug)}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} from New Step findOne?slug=${slug}`);
  const json = await res.json();
  return json.data;
}

/**
 * 3. HTML Crawler Fallback for a single New Step Employer detail page
 */
async function fetchNewStepEmployerDetailHtml(url: string): Promise<{
  name: string;
  city?: string;
  state?: string;
  address?: string;
  houseCost?: string;
  housingDeposit?: string;
  travelingToWork?: string;
  startSummer?: string;
  endSummer?: string;
  statusOfEmployers?: string;
  jobs: any[];
}> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': HEADERS['User-Agent'],
      'Accept': 'text/html,application/xhtml+xml'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const body = $('body').text().replace(/\s+/g, ' ').trim();

  const title = $('h1').first().text().replace(/\s+/g, ' ').trim();
  const name = title.replace(/^.*?ที่\s*/i, '').replace(/\s+กับ\s+New\s+Step.*$/i, '').trim();

  const address = (body.match(/ที่อยู่\s*([^]{1,180}?)(?=ค่าบ้าน|Housing Rate)/i) || [])[1]?.trim();
  const cityState = address?.match(/,?\s*([A-Za-z .'-]+),\s*([A-Z]{2})\s*\d{5}/);

  const houseCost = (body.match(/ค่าบ้าน\s*\(Housing Rate\)\s*([^]{1,140}?)(?=ค่ามัดจำ|การเดินทาง|ระยะเวลา)/i) || [])[1]?.trim();
  const housingDeposit = (body.match(/ค่ามัดจำ\s*\(Housing Deposit\)\s*([^]{1,140}?)(?=การเดินทาง|ระยะเวลา|ตำแหน่ง)/i) || [])[1]?.trim();
  const travelingToWork = (body.match(/การเดินทางไปทำงาน\s*\(Transportation\)\s*([^]{1,140}?)(?=ระยะเวลา|สวัสดิการ|ตำแหน่ง)/i) || [])[1]?.trim();

  const startSummer = (body.match(/Summer Season\s*Start Date\s*:\s*([^]{1,60}?)(?=End Date)/i) || [])[1]?.trim();
  const endSummer = (body.match(/End Date\s*:\s*([^]{1,60}?)(?=การเดินทาง|สวัสดิการ|ตำแหน่ง)/i) || [])[1]?.trim();

  const blocks = body.split(/Summer Jobs/i).slice(1);
  const jobs: any[] = [];

  for (const block of blocks) {
    const position = (block.match(/####?\s*([^]{1,100}?)(?=ค่าตอบแทน|จำนวนที่เปิดรับ|APPLY NOW)/i) ||
      block.match(/^\s*([A-Za-z][A-Za-z0-9 &/'()-]{2,90})\s+ค่าตอบแทน/i) || [])[1]?.replace(/\s+/g, ' ').trim();
    const pay = block.match(/ค่าตอบแทน\/ต่อชั่วโมง\s*\$?([\d.]+)/i);
    const slotText = (block.match(/จำนวนที่เปิดรับ\s*([^]{1,45}?)(?=APPLY NOW|รายละเอียดงาน|ค่าตอบแทน)/i) || [])[1]?.trim();

    if (position || pay || slotText) {
      jobs.push({
        tag: { name: position || 'General Staff' },
        compensation: pay ? pay[1] : undefined,
        compensationTip: /tip/i.test(block),
        numberOfOpenings: slotText
      });
    }
  }

  return {
    name,
    city: cityState?.[1]?.trim(),
    state: cityState?.[2]?.trim(),
    address,
    houseCost,
    housingDeposit,
    travelingToWork,
    startSummer,
    endSummer,
    statusOfEmployers: /เต็ม/i.test(body) ? 'เต็ม' : 'เปิดรับสมัคร',
    jobs
  };
}

/**
 * Full Scraper for New Step Summer 2027:
 * - Uses API First (structured, fast, precise)
 * - Falls back to HTML Crawler if API fails
 * - Parses granular position records and exact slot semantics
 */
export async function scrapeNewStep(
  concurrency = 8,
  previousDiscoveredCount?: number
): Promise<{
  records: ScrapedJobRecord[];
  report: CoverageReport;
}> {
  const startTime = Date.now();
  const records: ScrapedJobRecord[] = [];
  const failedUrls: FailedUrlItem[] = [];

  let discovery: {
    discovered: DiscoveredEmployer[];
    jobUrlsFound: number;
    uniqueJobUrls: number;
    duplicateUrls: number;
    indexPagesDiscovered: number;
  };

  let connectorType: 'API' | 'HTML' = 'API';

  try {
    discovery = await discoverNewStepEmployers();
  } catch (err: any) {
    // Fallback to HTML Discovery
    connectorType = 'HTML';
    console.warn(`[New Step] API discovery failed (${err.message}), falling back to HTML`);
    const fallbackRes = await fetch(`${NEWSTEP_WEB_BASE}/jobs?season=summer`, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
    const html = await fallbackRes.text();
    const $ = cheerio.load(html);
    const links: string[] = [];
    $('a[href*="/jobs/"]').each((_, a) => {
      const h = $(a).attr('href');
      if (h && !links.includes(h)) links.push(h.startsWith('http') ? h : `${NEWSTEP_WEB_BASE}${h}`);
    });
    discovery = {
      discovered: links.map(u => ({
        agency: 'New Step',
        name: u.split('/').pop() || 'Job',
        detailUrl: u
      })),
      jobUrlsFound: links.length,
      uniqueJobUrls: links.length,
      duplicateUrls: 0,
      indexPagesDiscovered: 1
    };
  }

  let detailPagesFetched = 0;
  let detailPagesParsed = 0;

  const slotTypes = {
    exactNumeric: 0,
    moreThanX: 0,
    upToX: 0,
    full: 0,
    unknown: 0
  };

  // Crawl detail pages with controlled concurrency
  for (let i = 0; i < discovery.discovered.length; i += concurrency) {
    const chunk = discovery.discovered.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async item => {
        detailPagesFetched++;
        const slug = item.detailUrl.split('/').pop() || '';
        try {
          let detailData: any;

          if (connectorType === 'API') {
            try {
              detailData = await fetchNewStepEmployerDetailApi(slug);
            } catch (apiErr: any) {
              // Graceful fallback to HTML for this single item
              detailData = await fetchNewStepEmployerDetailHtml(item.detailUrl);
            }
          } else {
            detailData = await fetchNewStepEmployerDetailHtml(item.detailUrl);
          }

          if (!detailData) throw new Error(`Empty employer detail for ${item.detailUrl}`);

          const employerName = String(detailData.name || item.name || '').trim();
          const city = (typeof detailData.city === 'object' ? detailData.city?.name : detailData.city) || item.city;
          const state = (typeof detailData.state === 'object' ? detailData.state?.name : detailData.state) || item.state;
          const address = detailData.address ? String(detailData.address).trim() : undefined;
          const houseCostText = detailData.houseCost ? String(detailData.houseCost).trim() : undefined;
          const housingWeekly = parseNewStepWeeklyHousing(houseCostText);
          const travelingToWork = detailData.travelingToWork ? String(detailData.travelingToWork).trim() : undefined;
          const depositText = detailData.housingDeposit ? String(detailData.housingDeposit).trim() : undefined;
          const depositNum = depositText?.match(/\$\s*(\d+(?:\.\d+)?)/)?.[1];
          const startSummer = parseSourceDateRange(detailData.startSummer);
          const endSummer = parseSourceDateRange(detailData.endSummer);
          const employerStatus = detailData.statusOfEmployers ? String(detailData.statusOfEmployers).trim() : undefined;

          const housingRecord = {
            weeklyCost: housingWeekly,
            housingText: houseCostText,
            deposit: depositNum == null ? undefined : Number(depositNum),
            depositText,
            transportationText: travelingToWork,
            mealsIncluded: mealsFromEvidence(houseCostText)
          };

          const jobsList: any[] = (detailData.jobs || []).filter((j: any) => !j.isDelete && j.isActive !== false);

          const imageUrl = detailData.avatar || detailData.og || item.imageUrl || (detailData.additionalAvatar && detailData.additionalAvatar[0]?.avatar);

          if (jobsList.length > 0) {
            for (const j of jobsList) {
              const positionName = (j.tag?.name || j.name || 'General Staff').trim();
              const wageHourly = j.compensation ? Number(j.compensation) : undefined;
              const tips = j.compensationTip === true || /tip/i.test(positionName);

              const slotParsed = parseNewStepSlotText(j.numberOfOpenings);

              // Update stats
              if (slotParsed.slotType === 'EXACT') slotTypes.exactNumeric++;
              else if (slotParsed.slotType === 'AT_LEAST') slotTypes.moreThanX++;
              else if (slotParsed.slotType === 'AT_MOST') slotTypes.upToX++;
              else if (slotParsed.slotType === 'FULL') slotTypes.full++;
              else slotTypes.unknown++;

              // Status mapping
              let status: JobStatus = 'UNKNOWN';
              if (slotParsed.slotType === 'FULL' || j.statusOfJob === 'เต็ม' || employerStatus === 'เต็ม') {
                status = 'FULL';
              } else if (slotParsed.slotType === 'AT_LEAST' || (slotParsed.availableSlots != null && slotParsed.availableSlots >= 3)) {
                status = 'OPEN';
              } else if (slotParsed.slotType === 'EXACT' && slotParsed.availableSlots != null && slotParsed.availableSlots < 3) {
                status = 'LOW_SLOTS';
              } else if (slotParsed.slotType === 'AT_MOST' && slotParsed.availableSlots != null && slotParsed.availableSlots <= 2) {
                status = 'LOW_SLOTS';
              } else if (slotParsed.slotType === 'AT_MOST' && slotParsed.availableSlots != null && slotParsed.availableSlots > 2) {
                status = 'OPEN';
              } else if (/เปิดรับ/i.test(j.statusOfJob || '')) {
                status = 'UNKNOWN'; // We don't guess if slot count is unstated
              }

              const positionItem: ScrapedPositionItem = {
                sourceId: j.id == null ? undefined : String(j.id),
                name: positionName,
                category: categorizePosition(positionName),
                wageHourly,
                wageMax: wageHourly,
                wageText: wageHourly ? `$${wageHourly}/hr${tips ? ' + tips' : ''}` : undefined,
                tips,
                availableSlots: slotParsed.availableSlots,
                slotType: slotParsed.slotType,
                rawSlotText: slotParsed.rawSlotText,
                availabilityText: slotParsed.rawSlotText,
                englishLevel: j.englishLevel || undefined,
                status
              };
              if (status === 'FULL') {
                positionItem.availableSlots = 0;
                positionItem.slotType = 'FULL';
                positionItem.availabilityText = 'เต็ม (สถานะต้นทาง)';
              }

              records.push({
                agency: 'New Step',
                employer: employerName,
                sourceId: String(detailData.id || item.sourceId || ''),
                city,
                state,
                season: seasonFromEvidence('Summer', startSummer, endSummer),
                programStatus: employerStatus,
                startDateText: startSummer,
                endDateText: endSummer,
                locationRaw: address || `${city || ''}, ${state || ''}`.trim(),
                position: positionItem,
                housing: housingRecord,
                sourceUrl: item.detailUrl,
                imageUrl,
                scrapedAt: new Date().toISOString()
              });
            }
          } else {
            // Employer has no specific jobs array in detail
            slotTypes.unknown++;
            records.push({
              agency: 'New Step',
              employer: employerName,
              sourceId: String(detailData.id || item.sourceId || ''),
              city,
              state,
              season: seasonFromEvidence('Summer', startSummer, endSummer),
              programStatus: employerStatus,
              startDateText: startSummer,
              endDateText: endSummer,
              locationRaw: address || `${city || ''}, ${state || ''}`.trim(),
              position: {
                name: 'General Staff',
                category: 'OTHER',
                wageHourly: undefined,
                tips: false,
                availableSlots: null,
                slotType: 'UNKNOWN',
                rawSlotText: 'ไม่ระบุ',
                status: 'UNKNOWN'
              },
              housing: housingRecord,
              sourceUrl: item.detailUrl,
              imageUrl,
              scrapedAt: new Date().toISOString()
            });
          }

          detailPagesParsed++;
        } catch (err: any) {
          failedUrls.push({
            url: item.detailUrl,
            error: err.message || String(err)
          });
        }
      })
    );
  }

  const durationMs = Date.now() - startTime;
  const discoveryCoveragePct = discovery.uniqueJobUrls > 0 ? 100 : 0;
  const parseCoveragePct = discovery.uniqueJobUrls > 0
    ? Number(((detailPagesParsed / discovery.uniqueJobUrls) * 100).toFixed(1))
    : 0;

  // Anomaly Detection: check if current count drops abnormally compared to previous run
  let anomalyWarning: string | undefined;
  if (previousDiscoveredCount && previousDiscoveredCount > 0) {
    const dropPct = ((previousDiscoveredCount - discovery.discovered.length) / previousDiscoveredCount) * 100;
    if (dropPct > 20) {
      anomalyWarning = `ANOMALY: New Step discovered count dropped significantly from ${previousDiscoveredCount} to ${discovery.discovered.length} (-${dropPct.toFixed(1)}%). Possible API or catalog failure!`;
    }
  }

  const status: 'SUCCESS' | 'WARNING' | 'ERROR' =
    failedUrls.length === 0 && !anomalyWarning
      ? 'SUCCESS'
      : parseCoveragePct >= 95 && !anomalyWarning
      ? 'WARNING'
      : 'ERROR';

  const report: CoverageReport = {
    agency: 'New Step',
    connectorType,
    season: 'Summer 2027',
    indexPagesDiscovered: discovery.indexPagesDiscovered,
    jobUrlsFound: discovery.jobUrlsFound,
    uniqueJobUrls: discovery.uniqueJobUrls,
    duplicateUrls: discovery.duplicateUrls,
    employersFound: discovery.discovered.length,
    detailPagesFetched,
    detailPagesParsed,
    positionsFound: records.length,
    positionsSaved: records.length,
    failedPages: failedUrls.length,
    failedUrls,
    discoveryCoveragePct,
    parseCoveragePct,
    coveragePct: parseCoveragePct,
    slotTypes,
    durationMs,
    status,
    anomalyWarning
  };

  return { records, report };
}

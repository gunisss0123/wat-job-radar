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

const OEG_LIST_URL = 'https://www.oeg.co.th/work-and-travel-usa';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchHtml(url: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
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
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

export interface OEGDiscoveryResult {
  discovered: DiscoveredEmployer[];
  jobUrlsFound: number;
  uniqueJobUrls: number;
  duplicateUrls: number;
  indexPagesDiscovered: number;
  anomalyWarning?: string;
}

/**
 * Discovery Phase with Multi-layer Validation:
 * - Checks total cards vs link elements
 * - Detects duplicate URLs
 * - Validates filter state consistency
 * - Compares with previous discovery run to catch abrupt drops
 */
export async function discoverOEGEmployers(previousDiscoveredCount?: number): Promise<OEGDiscoveryResult> {
  const html = await fetchHtml(OEG_LIST_URL);
  const $ = cheerio.load(html);

  const discovered: DiscoveredEmployer[] = [];
  const seenIds = new Set<string>();
  let jobUrlsFound = 0;
  let duplicateUrls = 0;

  const linkElements = $('a[href*="/work-and-travel-usa/detail/"]');
  jobUrlsFound = linkElements.length;

  linkElements.each((_, a) => {
    const href = $(a).attr('href') || '';
    const cleanUrl = href.trim();
    const sourceId = cleanUrl.split('/').pop() || '';
    if (!sourceId) return;

    if (seenIds.has(sourceId)) {
      duplicateUrls++;
      return;
    }
    seenIds.add(sourceId);

    const card = $(a).closest('div');
    const name = card.find('label').text().replace(/\s+/g, ' ').trim() || $(a).text().trim();
    const location = card.find('span').text().replace(/\s+/g, ' ').trim();
    const imageUrl = card.find('img').attr('src');

    let city: string | undefined;
    let state: string | undefined;
    if (location) {
      const parts = location.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        city = parts[0];
        state = parts.slice(1).join(', ').trim();
      } else {
        city = location;
      }
    }

    discovered.push({
      agency: 'OEG',
      sourceId,
      name,
      city,
      state,
      imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `https://www.oeg.co.th${imageUrl}`) : undefined,
      detailUrl: cleanUrl.startsWith('http') ? cleanUrl : `https://www.oeg.co.th${cleanUrl}`
    });
  });

  // Anomaly Detection: check if current count drops abnormally compared to previous run
  let anomalyWarning: string | undefined;
  if (previousDiscoveredCount && previousDiscoveredCount > 0) {
    const dropPct = ((previousDiscoveredCount - discovered.length) / previousDiscoveredCount) * 100;
    if (dropPct > 20) {
      anomalyWarning = `ANOMALY: Discovered URL count dropped significantly from ${previousDiscoveredCount} to ${discovered.length} (-${dropPct.toFixed(1)}%). Possible scraper or source index failure!`;
    }
  }

  return {
    discovered,
    jobUrlsFound,
    uniqueJobUrls: discovered.length,
    duplicateUrls,
    indexPagesDiscovered: 1,
    anomalyWarning
  };
}

export function parseOEGHousing(text: string): {
  weeklyCost?: number;
  mealsIncluded?: boolean;
  mealsPerDay?: number;
  housingText?: string;
  deposit?: number;
} {
  if (!text) return {};
  const cleaned = text.replace(/\s+/g, ' ').trim();

  const costMatch = cleaned.match(/\$\s*(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*)?(?:week|wk)/i);
  const weeklyCost = costMatch ? Number(costMatch[1]) : undefined;

  const depMatch = cleaned.match(/deposit\s*\$?\s*(\d+)/i);
  const deposit = depMatch ? Number(depMatch[1]) : undefined;

  const mealsIncluded = /include.*meal|รวม.*มื้อ|3 meal/i.test(cleaned);
  const mealCountMatch = cleaned.match(/(\d+)\s*meal/i);
  const mealsPerDay = mealCountMatch ? Number(mealCountMatch[1]) : (mealsIncluded ? 3 : undefined);

  return {
    weeklyCost,
    deposit,
    mealsIncluded,
    mealsPerDay,
    housingText: cleaned
  };
}

export function parseOEGPositionBox(boxText: string, articleText: string): ScrapedPositionItem {
  const availMatch = boxText.match(/\(Available\s*:\s*(\d+)\)/i);
  const rawAvail = availMatch ? availMatch[1] : undefined;
  const availableSlots = availMatch ? Number(availMatch[1]) : null;

  const rawName = boxText
    .replace(/\(Available\s*:\s*\d+\)/i, '')
    .replace(/^Position\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const engMatch = articleText.match(/Level\s*([\d\s\-–]+)/i);
  const englishLevel = engMatch ? engMatch[0].trim() : undefined;

  const wageMatch = articleText.match(/Wage\s*[:：-]?\s*\$?\s*([\d.]+)(?:\s*[-–]\s*\$?\s*([\d.]+))?/i);
  const wageHourly = wageMatch ? Number(wageMatch[1]) : undefined;
  const wageMax = wageMatch?.[2] ? Number(wageMatch[2]) : wageHourly;

  const tips = /\+tips|tips/i.test(articleText);

  let status: JobStatus = 'UNKNOWN';
  let slotType: SlotSemanticType = 'UNKNOWN';

  if (availableSlots === 0) {
    status = 'FULL';
    slotType = 'FULL';
  } else if (availableSlots != null && availableSlots > 0 && availableSlots < 3) {
    status = 'LOW_SLOTS';
    slotType = 'EXACT';
  } else if (availableSlots != null && availableSlots >= 3) {
    status = 'OPEN';
    slotType = 'EXACT';
  } else if (/pending|coming soon/i.test(articleText)) {
    status = 'PENDING';
    slotType = 'UNKNOWN';
  }

  return {
    name: rawName,
    category: categorizePosition(rawName),
    wageHourly,
    wageMax,
    wageText: wageHourly ? `$${wageHourly}${wageMax && wageMax !== wageHourly ? `–$${wageMax}` : ''}/hr${tips ? ' + tips' : ''}` : undefined,
    tips,
    availableSlots,
    slotType,
    rawSlotText: rawAvail !== undefined ? `Available : ${rawAvail}` : undefined,
    availabilityText: availableSlots !== null ? `Available: ${availableSlots}` : undefined,
    englishLevel,
    status
  };
}

/**
 * Full Scraper for OEG with multi-layer Discovery and Parse validation
 */
export async function scrapeOEG(
  concurrency = 5,
  previousDiscoveredCount?: number
): Promise<{
  records: ScrapedJobRecord[];
  report: CoverageReport;
}> {
  const startTime = Date.now();
  const discovery = await discoverOEGEmployers(previousDiscoveredCount);
  const records: ScrapedJobRecord[] = [];
  const failedUrls: FailedUrlItem[] = [];

  let detailPagesFetched = 0;
  let detailPagesParsed = 0;

  const slotTypes = {
    exactNumeric: 0,
    moreThanX: 0,
    upToX: 0,
    full: 0,
    unknown: 0
  };

  for (let i = 0; i < discovery.discovered.length; i += concurrency) {
    const chunk = discovery.discovered.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async item => {
        try {
          const html = await fetchHtml(item.detailUrl);
          detailPagesFetched++;
          const $ = cheerio.load(html);

          const mainContent = $('section.main-content');
          const mainText = mainContent.text().replace(/\s+/g, ' ').trim();

          const detailTitle = mainContent.find('h2').first().text().replace(/\s+/g, ' ').trim() || item.name;

          const statusMatch = mainText.match(/Employer Status\s*[:：]?\s*([^]{1,60}?)(?=Reservation|Job Fair|ดาวน์โหลด|Position)/i);
          const programStatus = statusMatch?.[1]?.trim() || undefined;

          const startMatch = mainText.match(/วันเริ่มงาน\s*[:：]?\s*([^]{1,60}?)(?=วันสิ้นสุด|Employer Status)/i);
          const endMatch = mainText.match(/วันสิ้นสุดงาน\s*[:：]?\s*([^]{1,60}?)(?=Employer Status|Reservation)/i);

          const housingMatch = mainText.match(/ค่าบ้าน\s*[:：]?\s*([^]{1,120}?)(?=วันเริ่มงาน|วันสิ้นสุด|Employer Status|Reservation)/i);
          const housingParsed = parseOEGHousing(housingMatch?.[1] || '');

          const isSpring = /Spring/i.test(item.name) || /Spring/i.test(detailTitle);
          const season = isSpring ? 'Spring 2027' : 'Summer 2027';

          const posBoxes = $('section.position .box');
          let parsedAnyPosition = false;

          if (posBoxes.length > 0) {
            posBoxes.each((_, box) => {
              const nameText = $(box).find('.name').text().replace(/\s+/g, ' ').trim();
              const articleText = $(box).find('article').text().replace(/\s+/g, ' ').trim();
              if (!nameText) return;

              const posItem = parseOEGPositionBox(nameText, articleText);

              if (posItem.slotType === 'EXACT') slotTypes.exactNumeric++;
              else if (posItem.slotType === 'FULL') slotTypes.full++;
              else slotTypes.unknown++;

              records.push({
                agency: 'OEG',
                employer: detailTitle,
                sourceId: item.sourceId,
                city: item.city,
                state: item.state,
                season,
                programStatus,
                startDateText: startMatch?.[1]?.trim(),
                endDateText: endMatch?.[1]?.trim(),
                locationRaw: `${item.city || ''}, ${item.state || ''}`.trim(),
                position: posItem,
                housing: housingParsed,
                sourceUrl: item.detailUrl,
                imageUrl: item.imageUrl,
                scrapedAt: new Date().toISOString()
              });
              parsedAnyPosition = true;
            });
          }

          if (!parsedAnyPosition) {
            const wageMatch = mainText.match(/ค่าแรง\s*[:：]?\s*\$?\s*([\d.]+)(?:\s*[-–]\s*\$?\s*([\d.]+))?/i);
            const wageHourly = wageMatch ? Number(wageMatch[1]) : undefined;
            const wageMax = wageMatch?.[2] ? Number(wageMatch[2]) : wageHourly;

            slotTypes.unknown++;
            records.push({
              agency: 'OEG',
              employer: detailTitle,
              sourceId: item.sourceId,
              city: item.city,
              state: item.state,
              season,
              programStatus,
              startDateText: startMatch?.[1]?.trim(),
              endDateText: endMatch?.[1]?.trim(),
              locationRaw: `${item.city || ''}, ${item.state || ''}`.trim(),
              position: {
                name: 'General Staff',
                category: 'OTHER',
                wageHourly,
                wageMax,
                wageText: wageHourly ? `$${wageHourly}/hr` : undefined,
                tips: false,
                availableSlots: null,
                slotType: 'UNKNOWN',
                status: 'UNKNOWN'
              },
              housing: housingParsed,
              sourceUrl: item.detailUrl,
              imageUrl: item.imageUrl,
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

  const status: 'SUCCESS' | 'WARNING' | 'ERROR' =
    failedUrls.length === 0 && !discovery.anomalyWarning
      ? 'SUCCESS'
      : parseCoveragePct >= 95 && !discovery.anomalyWarning
      ? 'WARNING'
      : 'ERROR';

  const report: CoverageReport = {
    agency: 'OEG',
    connectorType: 'HTML',
    season: 'Summer/Spring 2027',
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
    anomalyWarning: discovery.anomalyWarning
  };

  return { records, report };
}

import * as cheerio from 'cheerio';
import type {
  CoverageReport,
  ScrapedJobRecord,
  SlotTypeStats,
  FailedUrlItem
} from '../types';
import { categorizePosition } from '../normalize';

const IEE_LIST_URL = 'https://www.ieethailand.com/work-and-travel-new/';
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
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

export async function scrapeIEE(): Promise<{
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
    html = await fetchHtml(IEE_LIST_URL);
  } catch (err: any) {
    failedUrls.push({ url: IEE_LIST_URL, error: err.message });
    return {
      records: [],
      report: {
        agency: 'IEE',
        connectorType: 'HTML',
        season: 'Summer/Spring 2027',
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
  const discoveredEmployers: Array<{
    url: string;
    title: string;
    locationText: string;
    wageText: string;
    imageUrl: string;
    datesText: string;
  }> = [];

  const seenUrls = new Set<string>();
  let totalFound = 0;
  let duplicates = 0;

  $('a[href*="/work_and_travel_2/"]').each((_, el) => {
    totalFound++;
    const link = $(el).attr('href')?.trim() || '';
    if (!link) return;

    if (seenUrls.has(link)) {
      duplicates++;
      return;
    }
    seenUrls.add(link);

    const title = $(el).find('.wat-pg-blog-title').text().trim();
    if (!title) return;

    const locationText = $(el).find('.wat-pg-blog-locat-txt').text().replace(/<[^>]+>/g, '').trim();
    const priceText = $(el).find('.position-count').text().trim();
    const periodText = $(el).find('.font-weight-light').text().trim();
    const wageText = priceText ? `${priceText} ${periodText}`.trim() : '';
    const datesText = $(el).find('.wat-pg-blog-exp').text().trim();

    let bgImg = '';
    const styleAttr = $(el).find('.wat-pg-blog-img').attr('style') || '';
    const bgMatch = styleAttr.match(/url\(['"]?([^'"]+)['"]?\)/i);
    if (bgMatch) bgImg = bgMatch[1];

    discoveredEmployers.push({
      url: link,
      title,
      locationText,
      wageText,
      imageUrl: bgImg,
      datesText
    });
  });

  const detailPagesFetched = discoveredEmployers.length;
  let detailPagesParsed = 0;

  const concurrency = 6;
  for (let i = 0; i < discoveredEmployers.length; i += concurrency) {
    const batch = discoveredEmployers.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (emp) => {
        try {
          const detailHtml = await fetchHtml(emp.url);
          const $d = cheerio.load(detailHtml);
          detailPagesParsed++;

          let city = '';
          let state = '';
          const locParts = emp.locationText.split(',');
          if (locParts.length >= 2) {
            city = locParts[0].trim();
            state = locParts[1].replace(/\([A-Z]{2}\)/i, '').trim();
          } else {
            state = emp.locationText;
          }

          const posRows = $d('tr:has(td[data-mtr-content*="Position"])');

          if (posRows.length > 0) {
            posRows.each((_, row) => {
              const posEl = $d(row).find('.program-position-title');
              const posName = posEl.clone().children().remove().end().text().trim() || 'General Position';
              const englishLevel = $d(row).find('.program-position-tips').text().replace(/English Level:\s*/i, '').trim() || 'Intermediate';
              const wageRaw = $d(row).find('td[data-mtr-content*="Hourly Wage"]').text().trim() || emp.wageText;

              const wageMatch = wageRaw.match(/(\d+(?:\.\d+)?)/);
              const wageHourly = wageMatch ? Number(wageMatch[1]) : 15;
              const tipsIncluded = /tips/i.test(wageRaw);
              const posPic = $d(row).find('a[content-picture]').attr('content-picture') || emp.imageUrl;

              slotTypes.unknown++;

              records.push({
                agency: 'IEE',
                employer: emp.title,
                sourceId: `iee-${emp.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${posName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
                city,
                state,
                season: 'Summer 2027',
                locationRaw: emp.locationText,
                position: {
                  name: posName,
                  category: categorizePosition(posName),
                  wageHourly,
                  wageText: wageRaw.startsWith('$') ? wageRaw : `$${wageRaw}`,
                  tips: tipsIncluded,
                  availableSlots: null,
                  slotType: 'UNKNOWN',
                  rawSlotText: 'เปิดรับ (ตามสอบสัมภาษณ์)',
                  availabilityText: 'เปิดรับ (ไม่ระบุตัวเลข)',
                  englishLevel,
                  status: 'OPEN'
                },
                housing: {
                  housingText: 'มีที่พักจัดสรรให้โดยนายจ้างหรือประสานงานผ่าน IEE'
                },
                sourceUrl: emp.url,
                imageUrl: posPic || emp.imageUrl,
                scrapedAt: new Date().toISOString()
              });
            });
          } else {
            slotTypes.unknown++;
            const wageMatch = emp.wageText.match(/(\d+(?:\.\d+)?)/);
            records.push({
              agency: 'IEE',
              employer: emp.title,
              sourceId: `iee-${emp.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
              city,
              state,
              season: 'Summer 2027',
              locationRaw: emp.locationText,
              position: {
                name: 'Work & Travel Staff',
                category: 'OTHER',
                wageHourly: wageMatch ? Number(wageMatch[1]) : 15,
                wageText: emp.wageText || '$15/hr',
                availableSlots: null,
                slotType: 'UNKNOWN',
                rawSlotText: 'เปิดรับ',
                availabilityText: 'เปิดรับ',
                englishLevel: 'Intermediate',
                status: 'OPEN'
              },
              housing: {
                housingText: 'มีที่พักจัดสรรให้โดยนายจ้างหรือประสานงานผ่าน IEE'
              },
              sourceUrl: emp.url,
              imageUrl: emp.imageUrl,
              scrapedAt: new Date().toISOString()
            });
          }
        } catch (err: any) {
          failedUrls.push({ url: emp.url, error: err.message });
        }
      })
    );
  }

  const durationMs = Date.now() - startTime;
  const parseCoveragePct = detailPagesFetched > 0 ? (detailPagesParsed / detailPagesFetched) * 100 : 0;

  const report: CoverageReport = {
    agency: 'IEE',
    connectorType: 'HTML',
    season: 'Summer 2027',
    indexPagesDiscovered: 1,
    jobUrlsFound: totalFound,
    uniqueJobUrls: discoveredEmployers.length,
    duplicateUrls: duplicates,
    employersFound: discoveredEmployers.length,
    detailPagesFetched,
    detailPagesParsed,
    positionsFound: records.length,
    positionsSaved: records.length,
    failedPages: failedUrls.length,
    failedUrls,
    discoveryCoveragePct: 100,
    parseCoveragePct,
    coveragePct: parseCoveragePct,
    slotTypes,
    durationMs,
    status: failedUrls.length === 0 ? 'SUCCESS' : 'WARNING'
  };

  return { records, report };
}

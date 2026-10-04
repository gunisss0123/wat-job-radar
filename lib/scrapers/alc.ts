import type {
  CoverageReport,
  ScrapedJobRecord,
  JobStatus,
  SlotSemanticType,
  SlotTypeStats,
  FailedUrlItem
} from '../types';
import { categorizePosition } from '../normalize';
import { parseWeeklyCost, seasonFromEvidence } from '../dataIntegrity';

const ALC_API_BASE = 'https://api.myalcapp.com/api/v1/web/wat/job';
const ALC_WEB_BASE = 'https://myalcapp.com/work-and-travel/jobs';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

export async function scrapeALC(): Promise<{
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

  // 1. Discovery Phase
  let allRawJobs: any[] = [];
  let page = 1;
  let indexPagesDiscovered = 0;

  try {
    while (true) {
      const url = `${ALC_API_BASE}?page=${page}&size=100`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        failedUrls.push({ url, error: `HTTP ${res.status}` });
        break;
      }
      const data = await res.json();
      indexPagesDiscovered++;
      const jobs = data?.data?.jobs || [];
      if (!jobs.length) break;
      allRawJobs.push(...jobs);
      if (jobs.length < 100) break;
      page++;
      await new Promise((r) => setTimeout(r, 60));
    }
  } catch (err: any) {
    failedUrls.push({ url: ALC_API_BASE, error: err.message });
  }

  const jobUrlsFound = allRawJobs.length;
  const uniqueMap = new Map<string, any>();
  for (const j of allRawJobs) {
    const key = `${j.custom_url || j.id}-${j.season || 'Summer'}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, j);
    }
  }
  const uniqueJobs = Array.from(uniqueMap.values());
  const duplicateUrls = jobUrlsFound - uniqueJobs.length;

  let detailPagesFetched = 0;
  let detailPagesParsed = 0;

  // 2. Fetch details
  const concurrency = 6;
  for (let i = 0; i < uniqueJobs.length; i += concurrency) {
    const batch = uniqueJobs.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (rawJob) => {
        const detailUrl = `${ALC_API_BASE}/url/${rawJob.custom_url}?season=${encodeURIComponent(rawJob.season || 'Summer')}`;
        const webUrl = `${ALC_WEB_BASE}/${(rawJob.season || 'summer').toLowerCase()}/${String(rawJob.custom_url || '').trim()}`;
        detailPagesFetched++;

        try {
          const detailRes = await fetch(detailUrl, { headers: HEADERS });
          if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`);
          const detailJson = await detailRes.json();
          if (!detailJson?.data) throw new Error('Missing job detail');
          const jobDetail = detailJson.data;

          detailPagesParsed++;

          const employerName = jobDetail.job_name || rawJob.job_name || 'ALC Employer';
          const season = seasonFromEvidence(jobDetail.season || rawJob.season || 'Unknown', jobDetail.start_earliest, jobDetail.end_latest);
          const state = jobDetail.state_name || rawJob.state_name || jobDetail.state_code;
          const city = jobDetail.city_name || rawJob.city_name;
          const imageUrl = jobDetail.image || rawJob.image || (jobDetail.image_paths && jobDetail.image_paths[0]);

          const rawPositions: any[] = jobDetail.positions && jobDetail.positions.length > 0
            ? jobDetail.positions
            : [
                {
                  position: jobDetail.category || rawJob.category || 'General Staff',
                  rate: jobDetail.pay_rate || rawJob.pay_rate,
                  available: null,
                  language_level: []
                }
              ];

          const housingText = jobDetail.housing_costs
            ? `${jobDetail.housing_costs} (${jobDetail.house_type || 'Provided'})`
            : jobDetail.house_type || undefined;
          let weeklyHousing = parseWeeklyCost(jobDetail.housing_costs);

          for (const pos of rawPositions) {
            const posName = pos.position || 'General Position';
            const rateStr = String(pos.rate || jobDetail.pay_rate || '');
            const rateMatch = rateStr.match(/(\d+(?:\.\d+)?)/);
            const wageHourly = rateMatch ? Number(rateMatch[1]) : undefined;
            const tipsIncluded = /tips/i.test(rateStr);

            let availSlots: number | null = null;
            let slotType: SlotSemanticType = 'UNKNOWN';
            const rawAvail = pos.available != null ? String(pos.available) : null;

            if (rawAvail != null && rawAvail !== '') {
              const num = Number(rawAvail);
              if (Number.isInteger(num) && num >= 0) {
                if (num === 0) {
                  slotType = 'FULL';
                  availSlots = 0;
                  slotTypes.full++;
                } else {
                  slotType = 'EXACT';
                  availSlots = num;
                  slotTypes.exactNumeric++;
                }
              } else {
                slotTypes.unknown++;
              }
            } else {
              slotTypes.unknown++;
            }

            let status: JobStatus = 'UNKNOWN';
            if (slotType === 'FULL' || availSlots === 0) {
              status = 'FULL';
            } else if (availSlots != null && availSlots <= 2) {
              status = 'LOW_SLOTS';
            } else if (availSlots != null && availSlots > 2) {
              status = 'OPEN';
            }

            let englishLevel: string | undefined;
            if (Array.isArray(pos.language_level) && pos.language_level.length > 0) {
              englishLevel = pos.language_level.join(', ');
            }

            records.push({
              agency: 'ALC',
              employer: employerName,
              sourceId: `alc-${rawJob.id}-${pos.position_id || posName}`,
              city,
              state,
              season,
              startDateText: jobDetail.start_earliest ? jobDetail.start_earliest.split(' ')[0] : undefined,
              endDateText: jobDetail.end_latest ? jobDetail.end_latest.split(' ')[0] : undefined,
              position: {
                name: posName,
                category: categorizePosition(posName),
                wageHourly,
                wageText: rateStr ? (rateStr.startsWith('$') ? rateStr : `$${rateStr}/hr`) : undefined,
                tips: tipsIncluded,
                availableSlots: availSlots,
                slotType,
                rawSlotText: rawAvail ? `${rawAvail} คน` : 'ไม่ระบุ',
                availabilityText: availSlots != null ? `${availSlots} คน` : 'ไม่ระบุ',
                englishLevel,
                status
              },
              housing: {
                weeklyCost: weeklyHousing,
                housingText
              },
              sourceUrl: webUrl,
              imageUrl,
              scrapedAt: new Date().toISOString()
            });
          }
        } catch (err: any) {
          failedUrls.push({ url: detailUrl, error: err.message });
        }
      })
    );
  }

  const durationMs = Date.now() - startTime;
  const positionsDiscovered = records.length;
  const parseCoveragePct = detailPagesFetched > 0 ? (detailPagesParsed / detailPagesFetched) * 100 : 0;

  const report: CoverageReport = {
    agency: 'ALC',
    connectorType: 'API',
    season: 'Summer/Spring 2027',
    indexPagesDiscovered,
    jobUrlsFound,
    uniqueJobUrls: uniqueJobs.length,
    duplicateUrls,
    employersFound: uniqueJobs.length,
    detailPagesFetched,
    detailPagesParsed,
    positionsFound: positionsDiscovered,
    positionsSaved: positionsDiscovered,
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

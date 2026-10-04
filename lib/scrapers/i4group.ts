import type { CoverageReport, ScrapedJobRecord } from '../types';

// The previous connector published a fixed catalog, without parsing offers from the response.
// Keep this source unavailable until a parser with verifiable field-level evidence exists.
export async function scrapeI4Group(): Promise<{ records: ScrapedJobRecord[]; report: CoverageReport }> {
  return { records: [], report: {
    agency: 'I4 Group', connectorType: 'TBD', season: 'ไม่ยืนยันปี',
    indexPagesDiscovered: 0, jobUrlsFound: 0, uniqueJobUrls: 0, duplicateUrls: 0,
    employersFound: 0, detailPagesFetched: 0, detailPagesParsed: 0,
    positionsFound: 0, positionsSaved: 0, failedPages: 1,
    failedUrls: [{ url: 'https://i4gs.com/', error: 'ตรวจหน้าโครงการและข่าวบน i4gs.com แล้ว ยังไม่พบรายการนายจ้าง/ตำแหน่งงานสาธารณะปัจจุบัน; เว็บไซต์สมาชิก https://www.i4gs-application.com/login ต้องเข้าสู่ระบบ ไม่ได้หมายความว่า Agency ไม่มีงาน' }],
    discoveryCoveragePct: 0, parseCoveragePct: 0, coveragePct: 0,
    slotTypes: { exactNumeric: 0, moreThanX: 0, upToX: 0, full: 0, unknown: 0 },
    durationMs: 0, status: 'ERROR'
  } };
}

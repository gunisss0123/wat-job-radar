import { scrapers } from '../lib/scrapers';
import { ingestScrapedRecords, loadLocalStore } from '../lib/engine';

async function main() {
  for (const [agency, scrape] of Object.entries(scrapers)) {
    try {
      const { records, report } = await scrape();
      const result = await ingestScrapedRecords(records, report);
      console.log(JSON.stringify({ agency, status: report.status, saved: result.savedPositions, failed: report.failedPages, coverage: report.coveragePct }));
      // TBD sources are explicitly unavailable, rather than claimed successful.
      if (report.status === 'ERROR' && report.connectorType !== 'TBD') process.exitCode = 1;
    } catch (error) {
      console.error(agency, error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
  console.log('Active positions:', Object.values(loadLocalStore().positions).filter(p => !p.isStale).length);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

import { scrapers } from '../lib/scrapers';
import { ingestScrapedRecords, loadLocalStore } from '../lib/engine';

async function main() {
  let successCount = 0;
  for (const [agency, scrape] of Object.entries(scrapers)) {
    try {
      const { records, report } = await scrape();
      const result = await ingestScrapedRecords(records, report);
      console.log(JSON.stringify({ agency, status: report.status, saved: result.savedPositions, failed: report.failedPages, coverage: report.coveragePct }));
      if (report.status === 'SUCCESS' || report.status === 'WARNING') {
        successCount++;
      }
    } catch (error) {
      console.error(`[${agency} Sync Warning]:`, error instanceof Error ? error.message : String(error));
    }
  }
  const totalActive = Object.values(loadLocalStore().positions).filter(p => !p.isStale).length;
  console.log(`Sync finished. Active positions: ${totalActive} (Successful agency connectors: ${successCount})`);
}

main().catch(error => {
  console.error('Fatal sync error:', error.message);
  process.exitCode = 1;
});

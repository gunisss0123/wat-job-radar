import { scrapeOEG } from '../lib/scrapers/oeg';
import { ingestScrapedRecords, loadLocalStore } from '../lib/engine';

async function main() {
  console.log('====================================================');
  console.log('       WAT JOB RADAR V1 — OEG SYNC & AUDIT          ');
  console.log('====================================================\n');

  console.log('[1/2] Discovering & Crawling OEG Public Jobs...');
  const storeBefore = loadLocalStore();
  const prevCount = storeBefore.sourceHealth['OEG']?.employersCount;

  const { records, report } = await scrapeOEG(5, prevCount);
  const { savedPositions, newSnapshots, report: finalReport } = await ingestScrapedRecords(records, report);

  console.log('\n====================================================');
  console.log('                 OEG — SUMMER/SPRING 2027           ');
  console.log('====================================================');
  console.log(`Index pages discovered:       ${finalReport.indexPagesDiscovered}`);
  console.log(`Job URLs found:              ${finalReport.jobUrlsFound}`);
  console.log(`Unique job URLs:             ${finalReport.uniqueJobUrls}`);
  console.log(`Duplicate URLs:               ${finalReport.duplicateUrls}`);
  console.log('');
  console.log(`Detail pages fetched:        ${finalReport.detailPagesFetched}`);
  console.log(`Detail pages parsed:         ${finalReport.detailPagesParsed}`);
  console.log(`Failed pages:                 ${finalReport.failedPages}`);
  console.log('');
  console.log(`Positions discovered:       ${finalReport.positionsFound}`);
  console.log(`Positions saved:            ${savedPositions}`);
  console.log('');
  console.log(`Discovery coverage:        ${finalReport.discoveryCoveragePct.toFixed(1)}%`);
  console.log(`Parse coverage:             ${finalReport.parseCoveragePct.toFixed(1)}%`);
  console.log('');
  console.log('Slot types:');
  console.log(`Exact numeric:               ${finalReport.slotTypes.exactNumeric}`);
  console.log(`More than X:                 ${finalReport.slotTypes.moreThanX}`);
  console.log(`Up to X:                     ${finalReport.slotTypes.upToX}`);
  console.log(`Full:                        ${finalReport.slotTypes.full}`);
  console.log(`Unknown:                     ${finalReport.slotTypes.unknown}`);
  console.log('----------------------------------------------------');
  console.log(`Duration:                    ${(finalReport.durationMs / 1000).toFixed(2)}s`);
  console.log(`Snapshots recorded:          ${newSnapshots}`);

  if (finalReport.anomalyWarning) {
    console.log(`\n⚠ WARNING: ${finalReport.anomalyWarning}`);
  }

  if (finalReport.failedUrls.length > 0) {
    console.log('\n--- FAILED DETAIL PAGES ---');
    for (const f of finalReport.failedUrls) {
      console.log(`  -> URL: ${f.url} | Error: ${f.error}`);
    }
  }

  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Fatal error during OEG sync:', err);
  process.exit(1);
});

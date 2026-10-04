import { scrapeNewStep } from '../lib/scrapers/newstep';
import { ingestScrapedRecords, loadLocalStore } from '../lib/engine';

async function main() {
  console.log('====================================================');
  console.log('     WAT JOB RADAR V1 — NEW STEP SYNC & AUDIT       ');
  console.log('====================================================\n');

  console.log('[1/2] Discovering & Ingesting New Step Summer 2027 Jobs (API First)...');
  const storeBefore = loadLocalStore();
  const prevCount = storeBefore.sourceHealth['New Step']?.employersCount;

  const { records, report } = await scrapeNewStep(8, prevCount);
  const { savedPositions, newSnapshots } = await ingestScrapedRecords(records, report);

  console.log('\n====================================================');
  console.log('              NEW STEP — SUMMER 2027                ');
  console.log('====================================================');
  console.log(`Index pages discovered:       ${report.indexPagesDiscovered}`);
  console.log(`Job URLs found:              ${report.jobUrlsFound}`);
  console.log(`Unique job URLs:             ${report.uniqueJobUrls}`);
  console.log(`Duplicate URLs:               ${report.duplicateUrls}`);
  console.log('');
  console.log(`Detail pages fetched:        ${report.detailPagesFetched}`);
  console.log(`Detail pages parsed:         ${report.detailPagesParsed}`);
  console.log(`Failed pages:                 ${report.failedPages}`);
  console.log('');
  console.log(`Positions discovered:       ${report.positionsFound}`);
  console.log(`Positions saved:            ${savedPositions}`);
  console.log('');
  console.log(`Discovery coverage:        ${report.discoveryCoveragePct.toFixed(1)}%`);
  console.log(`Parse coverage:             ${report.parseCoveragePct.toFixed(1)}%`);
  console.log('');
  console.log('Slot types:');
  console.log(`Exact numeric:               ${report.slotTypes.exactNumeric}`);
  console.log(`More than X:                 ${report.slotTypes.moreThanX}`);
  console.log(`Up to X:                     ${report.slotTypes.upToX}`);
  console.log(`Full:                        ${report.slotTypes.full}`);
  console.log(`Unknown:                     ${report.slotTypes.unknown}`);
  console.log('----------------------------------------------------');
  console.log(`Duration:                    ${(report.durationMs / 1000).toFixed(2)}s`);
  console.log(`Snapshots recorded:          ${newSnapshots}`);

  if (report.anomalyWarning) {
    console.log(`\n⚠ WARNING: ${report.anomalyWarning}`);
  }

  if (report.failedUrls.length > 0) {
    console.log('\n--- FAILED DETAIL PAGES ---');
    for (const f of report.failedUrls) {
      console.log(`  -> URL: ${f.url} | Error: ${f.error}`);
    }
  }

  console.log('====================================================\n');

  // Verify Sample Granular Positions with Slot Semantics
  const store = loadLocalStore();
  const samplePositions = Object.values(store.positions).filter(p => {
    const ae = store.agencyEmployers[p.agencyEmployerId];
    return ae && ae.agencyId === 'New Step';
  }).slice(0, 15);

  console.log('--- Sample Parsed New Step Positions (Semantic Slots) ---');
  for (const pos of samplePositions) {
    const ae = store.agencyEmployers[pos.agencyEmployerId];
    const rawSlot = pos.availabilityText || 'N/A';
    console.log(`[${(pos.slotType || 'UNKNOWN').padEnd(8)}] [${pos.status.padEnd(8)}] ${pos.positionName.padEnd(25)} | ${pos.wageText?.padEnd(16) || 'N/A'.padEnd(16)} | Slots: ${rawSlot.padEnd(16)} | Employer: ${ae?.sourceEmployerName}`);
  }
}

main().catch(err => {
  console.error('Fatal error during New Step sync:', err);
  process.exit(1);
});

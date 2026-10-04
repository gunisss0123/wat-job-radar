import { scrapeOEG } from '../lib/scrapers/oeg';
import { scrapeNewStep } from '../lib/scrapers/newstep';
import { ingestScrapedRecords, loadLocalStore } from '../lib/engine';
import type { CoverageReport } from '../lib/types';

function printAuditReport(r: CoverageReport, title: string) {
  console.log('====================================================');
  console.log(`              ${title.toUpperCase()}                `);
  console.log('====================================================');
  console.log(`Index pages discovered:       ${r.indexPagesDiscovered}`);
  console.log(`Job URLs found:              ${r.jobUrlsFound}`);
  console.log(`Unique job URLs:             ${r.uniqueJobUrls}`);
  console.log(`Duplicate URLs:               ${r.duplicateUrls}`);
  console.log('');
  console.log(`Detail pages fetched:        ${r.detailPagesFetched}`);
  console.log(`Detail pages parsed:         ${r.detailPagesParsed}`);
  console.log(`Failed pages:                 ${r.failedPages}`);
  console.log('');
  console.log(`Positions discovered:       ${r.positionsFound}`);
  console.log(`Positions saved:            ${r.positionsSaved}`);
  console.log('');
  console.log(`Discovery coverage:        ${r.discoveryCoveragePct.toFixed(1)}%`);
  console.log(`Parse coverage:             ${r.parseCoveragePct.toFixed(1)}%`);
  console.log('');
  console.log('Slot types:');
  console.log(`Exact numeric:               ${r.slotTypes.exactNumeric}`);
  console.log(`More than X:                 ${r.slotTypes.moreThanX}`);
  console.log(`Up to X:                     ${r.slotTypes.upToX}`);
  console.log(`Full:                        ${r.slotTypes.full}`);
  console.log(`Unknown:                     ${r.slotTypes.unknown}`);
  console.log('----------------------------------------------------');
  console.log(`Duration:                    ${(r.durationMs / 1000).toFixed(2)}s`);
  if (r.anomalyWarning) {
    console.log(`\n⚠ WARNING: ${r.anomalyWarning}`);
  }
  if (r.failedUrls.length > 0) {
    console.log('\n--- FAILED DETAIL PAGES ---');
    for (const f of r.failedUrls) {
      console.log(`  -> URL: ${f.url} | Error: ${f.error}`);
    }
  }
  console.log('====================================================\n');
}

async function runCoverageCheck() {
  console.log('========================================================');
  console.log('            WAT JOB RADAR V1 — COVERAGE AUDIT           ');
  console.log('========================================================\n');

  const storeBefore = loadLocalStore();
  const reports: CoverageReport[] = [];

  // 1. OEG Audit
  console.log('[1/2] Auditing OEG...');
  try {
    const prevOEG = storeBefore.sourceHealth['OEG']?.employersCount;
    const { records: oegRecords, report: oegReport } = await scrapeOEG(5, prevOEG);
    const { report: finalOegReport } = await ingestScrapedRecords(oegRecords, oegReport);
    reports.push(finalOegReport);
    printAuditReport(finalOegReport, 'OEG — Summer/Spring 2027');
  } catch (err: any) {
    console.error('OEG Coverage Failed:', err.message);
  }

  // 2. New Step Audit
  console.log('[2/2] Auditing New Step...');
  try {
    const prevNewStep = storeBefore.sourceHealth['New Step']?.employersCount;
    const { records: nsRecords, report: nsReport } = await scrapeNewStep(8, prevNewStep);
    const { report: finalNsReport } = await ingestScrapedRecords(nsRecords, nsReport);
    reports.push(finalNsReport);
    printAuditReport(finalNsReport, 'New Step — Summer 2027');
  } catch (err: any) {
    console.error('New Step Coverage Failed:', err.message);
  }

  // Master Summary Table
  console.log('========================================================================');
  console.log('                        MASTER COVERAGE AUDIT                           ');
  console.log('========================================================================');
  console.log(
    'Agency'.padEnd(12) +
    'Type'.padEnd(10) +
    'Employers'.padEnd(12) +
    'Positions'.padEnd(12) +
    'Discovery'.padEnd(12) +
    'Parse'.padEnd(10) +
    'Status'
  );
  console.log('-'.repeat(72));
  for (const r of reports) {
    console.log(
      r.agency.padEnd(12) +
      r.connectorType.padEnd(10) +
      String(r.employersFound).padEnd(12) +
      String(r.positionsSaved).padEnd(12) +
      `${r.discoveryCoveragePct.toFixed(1)}%`.padEnd(12) +
      `${r.parseCoveragePct.toFixed(1)}%`.padEnd(10) +
      (r.failedPages === 0 ? 'Healthy' : `${r.status} (${r.failedPages} failed)`)
    );
  }
  console.log('========================================================================\n');
}

runCoverageCheck().catch(err => {
  console.error('Fatal coverage check error:', err);
  process.exit(1);
});

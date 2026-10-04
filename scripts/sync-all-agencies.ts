import { scrapeALC } from '../lib/scrapers/alc';
import { scrapeIEE } from '../lib/scrapers/iee';
import { scrapeIHappy } from '../lib/scrapers/ihappy';
import { scrapeAcadex } from '../lib/scrapers/acadex';
import { ingestScrapedRecords, loadLocalStore } from '../lib/engine';

async function main() {
  console.log('====================================================');
  console.log('   WAT JOB RADAR V1 — MULTI-AGENCY SYNC & AUDIT     ');
  console.log('      (ALC, IEE, iHappy, OEG, New Step, ACADEX)     ');
  console.log('====================================================\n');

  // 1. Sync ALC
  console.log('[1/4] Scraping ALC (American Learning) via REST API...');
  try {
    const { records: alcRecords, report: alcReport } = await scrapeALC();
    const { savedPositions: alcSaved } = await ingestScrapedRecords(alcRecords, alcReport);
    console.log(`✓ ALC: ${alcSaved} positions saved across ${alcReport.employersFound} employers (${alcReport.failedPages} failed)`);
  } catch (err: any) {
    console.error('✗ ALC Error:', err.message);
  }

  // 2. Sync IEE
  console.log('\n[2/4] Scraping IEE Thailand via Web Crawler...');
  try {
    const { records: ieeRecords, report: ieeReport } = await scrapeIEE();
    const { savedPositions: ieeSaved } = await ingestScrapedRecords(ieeRecords, ieeReport);
    console.log(`✓ IEE: ${ieeSaved} positions saved across ${ieeReport.employersFound} employers (${ieeReport.failedPages} failed)`);
  } catch (err: any) {
    console.error('✗ IEE Error:', err.message);
  }

  // 3. Sync iHappy
  console.log('\n[3/4] Scraping iHappy Education via TablePress Crawler...');
  try {
    const { records: ihappyRecords, report: ihappyReport } = await scrapeIHappy();
    const { savedPositions: ihappySaved } = await ingestScrapedRecords(ihappyRecords, ihappyReport);
    console.log(`✓ iHappy: ${ihappySaved} positions saved across ${ihappyReport.employersFound} employers (${ihappyReport.failedPages} failed)`);
  } catch (err: any) {
    console.error('✗ iHappy Error:', err.message);
  }

  // 4. Sync ACADEX
  console.log('\n[4/4] Scraping ACADEX Thailand via Web Crawler...');
  try {
    const { records: acadexRecords, report: acadexReport } = await scrapeAcadex();
    const { savedPositions: acadexSaved } = await ingestScrapedRecords(acadexRecords, acadexReport);
    console.log(`✓ ACADEX: ${acadexSaved} positions saved across ${acadexReport.employersFound} employers (${acadexReport.failedPages} failed)`);
  } catch (err: any) {
    console.error('✗ ACADEX Error:', err.message);
  }

  // Summary
  const store = loadLocalStore();
  const allPositions = Object.values(store.positions);
  const byAgency: Record<string, number> = {};
  for (const pos of allPositions) {
    const ae = store.agencyEmployers[pos.agencyEmployerId];
    if (ae) {
      byAgency[ae.agencyId] = (byAgency[ae.agencyId] || 0) + 1;
    }
  }

  console.log('\n====================================================');
  console.log('              TOTAL SYSTEM STATUS                   ');
  console.log('====================================================');
  console.log(`Total active employers in store: ${Object.keys(store.employers).length}`);
  console.log(`Total granular positions in store: ${allPositions.length}`);
  console.log('Breakdown by Agency:');
  for (const [agency, count] of Object.entries(byAgency)) {
    console.log(`  - ${agency.padEnd(12)}: ${count} positions`);
  }
  console.log('====================================================\n');
}

main().catch(console.error);

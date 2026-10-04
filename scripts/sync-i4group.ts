import { scrapeI4Group } from '../lib/scrapers/i4group';
import { ingestScrapedRecords, loadLocalStore } from '../lib/engine';

async function main() {
  console.log('====================================================');
  console.log('        I4 GROUP THAILAND WORK & TRAVEL SYNC        ');
  console.log('====================================================\n');

  console.log('Scraping I4 Group Thailand jobs...');
  try {
    const { records, report } = await scrapeI4Group();
    const { savedPositions, newSnapshots } = await ingestScrapedRecords(records, report);
    console.log(`\n✓ I4 Group sync complete!`);
    console.log(`  - Employers found: ${report.employersFound}`);
    console.log(`  - Positions found: ${report.positionsFound}`);
    console.log(`  - Positions saved in store: ${savedPositions} (New snapshots: ${newSnapshots})`);
    console.log(`  - Failed pages: ${report.failedPages}`);

    const store = loadLocalStore();
    const i4Positions = Object.values(store.positions).filter(p => {
      const ae = store.agencyEmployers[p.agencyEmployerId];
      return ae && ae.agencyId === 'I4 Group';
    });
    console.log(`  - Total active I4 Group positions in store: ${i4Positions.length}`);
  } catch (err: any) {
    console.error('✗ I4 Group Sync Error:', err);
    process.exit(1);
  }
}

main();

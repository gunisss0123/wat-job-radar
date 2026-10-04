import { scrapeAcadex } from '../lib/scrapers/acadex';
import { ingestScrapedRecords, loadLocalStore } from '../lib/engine';

async function main() {
  console.log('====================================================');
  console.log('       ACADEX THAILAND WORK & TRAVEL SYNC           ');
  console.log('====================================================\n');

  console.log('Scraping ACADEX location jobs...');
  try {
    const { records, report } = await scrapeAcadex();
    const { savedPositions, newSnapshots } = await ingestScrapedRecords(records, report);
    console.log(`\n✓ ACADEX sync complete!`);
    console.log(`  - Employers found: ${report.employersFound}`);
    console.log(`  - Positions found: ${report.positionsFound}`);
    console.log(`  - Positions saved in store: ${savedPositions} (New snapshots: ${newSnapshots})`);
    console.log(`  - Failed pages: ${report.failedPages}`);

    const store = loadLocalStore();
    const acadexPositions = Object.values(store.positions).filter(p => {
      const ae = store.agencyEmployers[p.agencyEmployerId];
      return ae && ae.agencyId === 'ACADEX';
    });
    console.log(`  - Total active ACADEX positions in store: ${acadexPositions.length}`);
  } catch (err: any) {
    console.error('✗ ACADEX Sync Error:', err);
    process.exit(1);
  }
}

main();

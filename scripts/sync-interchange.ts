import { scrapeInterchange } from '../lib/scrapers/interchange';
import { ingestScrapedRecords, loadLocalStore } from '../lib/engine';

async function main() {
  console.log('====================================================');
  console.log('       INTERCHANGE THAILAND WORK & TRAVEL SYNC      ');
  console.log('====================================================\n');

  console.log('Scraping Interchange Thailand jobs...');
  try {
    const { records, report } = await scrapeInterchange();
    const { savedPositions, newSnapshots } = await ingestScrapedRecords(records, report);
    console.log(`\n✓ Interchange sync complete!`);
    console.log(`  - Employers found: ${report.employersFound}`);
    console.log(`  - Positions found: ${report.positionsFound}`);
    console.log(`  - Positions saved in store: ${savedPositions} (New snapshots: ${newSnapshots})`);
    console.log(`  - Failed pages: ${report.failedPages}`);

    const store = loadLocalStore();
    const itcPositions = Object.values(store.positions).filter(p => {
      const ae = store.agencyEmployers[p.agencyEmployerId];
      return ae && ae.agencyId === 'Interchange';
    });
    console.log(`  - Total active Interchange positions in store: ${itcPositions.length}`);
  } catch (err: any) {
    console.error('✗ Interchange Sync Error:', err);
    process.exit(1);
  }
}

main();

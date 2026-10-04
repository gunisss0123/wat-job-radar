import fs from 'node:fs';
import { scrapeAcadex, parseAcadexAvailability } from '../lib/scrapers/acadex';
import { scrapeInterchange } from '../lib/scrapers/interchange';
import { scrapeI4Group } from '../lib/scrapers/i4group';
import { ingestScrapedRecords, loadLocalStore, saveLocalStore } from '../lib/engine';
import { recordIdentity, positionIdentity } from '../lib/dataIntegrity';

async function main() {
  const store = loadLocalStore();
  const results = process.argv.includes('--cached')
    ? JSON.parse(fs.readFileSync('data/connector-evidence/refresh.json', 'utf8')) as Awaited<ReturnType<typeof scrapeAcadex>>[]
    : await Promise.all([scrapeAcadex(), scrapeInterchange(), scrapeI4Group()]);
  if (process.argv.includes('--cached')) {
    const cards = parseAcadexAvailability(fs.readFileSync('data/connector-evidence/acadex.html', 'utf8'));
    for (const result of results) for (const record of result.records) {
      const card = record.agency === 'ACADEX' ? cards.get(record.sourceUrl) : undefined;
      if (card && ['COMING_SOON', 'FULL'].includes(card.status)) {
        record.position.status = card.status;
        record.position.availableSlots = card.status === 'FULL' ? 0 : null;
        record.position.slotType = card.status === 'FULL' ? 'FULL' : 'UNKNOWN';
        record.position.availabilityText = card.text + ' (หน้ารวมงาน)';
      }
    }
  }
  const audit: unknown[] = [];
  for (const { records, report } of results) {
    const ids = records.map(r => recordIdentity(r) + '|' + positionIdentity(r.position));
    if (new Set(ids).size !== ids.length) throw Error(`Duplicate offers: ${report.agency}`);
    if (records.length && report.failedPages === 0 && report.discoveryCoveragePct === 100) {
      for (const p of Object.values(store.positions)) {
        if (store.agencyEmployers[p.agencyEmployerId]?.agencyId === report.agency) p.isStale = true;
      }
    }
    const result = await ingestScrapedRecords(records, report, { store, persist: false, syncRemote: false });
    for (const s of store.snapshots) {
      const p = store.positions[s.positionId];
      if (p && store.agencyEmployers[p.agencyEmployerId]?.agencyId === report.agency && !p.isStale) s.baseline = true;
    }
    audit.push({ report, saved: result.savedPositions, records });
    console.log(JSON.stringify({ agency: report.agency, records: records.length, open: records.filter(r => ['OPEN','LIMITED','LOW_SLOTS'].includes(r.position.status)).length, failed: report.failedPages, coverage: report.coveragePct }));
  }
  saveLocalStore(store);
  fs.writeFileSync('data/connector-evidence/refresh.json', JSON.stringify(audit, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });

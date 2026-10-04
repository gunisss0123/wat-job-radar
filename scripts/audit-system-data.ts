import fs from 'node:fs';
import { scrapeOEG } from '../lib/scrapers/oeg';
import { scrapeNewStep } from '../lib/scrapers/newstep';
import { scrapeALC } from '../lib/scrapers/alc';
import { scrapeIEE } from '../lib/scrapers/iee';
import { scrapeIHappy } from '../lib/scrapers/ihappy';
import { scrapeAcadex } from '../lib/scrapers/acadex';
import { scrapeInterchange } from '../lib/scrapers/interchange';
import { scrapeI4Group } from '../lib/scrapers/i4group';
import { ingestScrapedRecords, loadLocalStore, saveLocalStore, type RadarStoreData } from '../lib/engine';
import { recordIdentity, positionIdentity, canAgeMissingRecords } from '../lib/dataIntegrity';
import type { ScrapedJobRecord } from '../lib/types';

function profile(store: RadarStoreData) {
  const byAgency: Record<string, any> = {};
  let orphanPositions = 0;
  for (const p of Object.values(store.positions)) {
    const ae = store.agencyEmployers[p.agencyEmployerId];
    if (!ae) { orphanPositions++; continue; }
    const stats = byAgency[ae.agencyId] ||= { total: 0, active: 0, stale: 0, seasons: {}, statuses: {}, unknownSlots: 0, unknownWage: 0, objectDates: 0, oldYearUrls: 0, stockImages: 0 };
    stats.total++; stats.stale += Number(p.isStale); stats.active += Number(!p.isStale);
    if (p.isStale) continue;
    stats.seasons[ae.season] = (stats.seasons[ae.season] || 0) + 1;
    stats.statuses[p.status] = (stats.statuses[p.status] || 0) + 1;
    stats.unknownSlots += Number(p.availableSlots == null);
    stats.unknownWage += Number(p.wageHourly == null);
    stats.objectDates += Number(/\[object Object\]/.test(`${ae.startDateText} ${ae.endDateText}`));
    stats.oldYearUrls += Number(/202[0-6]/.test(ae.sourceUrl));
    stats.stockImages += Number(/unsplash/.test(ae.imageUrl || ''));
  }
  return { updatedAt: store.lastUpdated, positions: Object.keys(store.positions).length, orphanPositions, byAgency };
}

async function main() {
  const apply = process.argv.includes('--apply-local');
  const fromCrawl = process.argv.includes('--from-crawl');
  const quarantine = process.argv.includes('--quarantine-unverified');
  const store = loadLocalStore();
  const cachedAudit = fromCrawl ? JSON.parse(fs.readFileSync('data/system-audit/latest.json', 'utf8')) : undefined;
  const cachedRecords: ScrapedJobRecord[] = fromCrawl ? JSON.parse(fs.readFileSync('data/system-audit/records.json', 'utf8')) : [];
  const before = cachedAudit?.before || profile(store);
  const priorFirstSeen = new Map<string, string>();
  for (const pos of Object.values(store.positions)) {
    const ae = store.agencyEmployers[pos.agencyEmployerId];
    if (!ae) continue;
    const key = `${ae.agencyId}|${ae.sourceUrl.trim()}|${pos.positionName}`;
    const previous = priorFirstSeen.get(key);
    if (!previous || pos.firstSeenAt < previous) priorFirstSeen.set(key, pos.firstSeenAt);
  }
  const sources = [scrapeOEG, scrapeNewStep, scrapeALC, scrapeIEE, scrapeIHappy, scrapeAcadex, scrapeInterchange, scrapeI4Group];
  const reports: any[] = [];
  const allRecords: ScrapedJobRecord[] = [];
  // Two connectors at a time, with each connector's bounded per-source concurrency.
  for (let i = 0; i < sources.length; i += 2) {
    const results = fromCrawl
      ? cachedAudit.reports.slice(i, i + 2).map((report: any) => ({ status: 'fulfilled' as const, value: { report, records: cachedRecords.filter(r => r.agency === report.agency) } }))
      : await Promise.allSettled(sources.slice(i, i + 2).map(scrape => scrape()));
    for (const result of results) {
      if (result.status === 'rejected') { reports.push({ error: String(result.reason) }); continue; }
      const { records, report } = result.value;
      report.positionsSaved = 0;
      const ids = records.map((r: ScrapedJobRecord) => `${recordIdentity(r)}|${positionIdentity(r.position)}`);
      const duplicates = ids.length - new Set(ids).size;
      const applicable = duplicates === 0 && (canAgeMissingRecords(report) || report.connectorType === 'TBD' || (quarantine && records.length > 0 && report.coveragePct >= 95));
      const reportEntry = { ...report, duplicateOfferPositions: duplicates, appliedLocally: apply && applicable };
      reports.push(reportEntry);
      allRecords.push(...records);
      console.log(JSON.stringify({ agency: report.agency, records: records.length, duplicates, fetched: report.detailPagesFetched, failed: report.failedPages, coverage: report.coveragePct }));
      if (apply && applicable) {
        // Preserve old records/history for inspection, but exclude superseded or fabricated data.
        for (const pos of Object.values(store.positions)) {
          if (store.agencyEmployers[pos.agencyEmployerId]?.agencyId === report.agency) pos.isStale = true;
        }
        for (const ae of Object.values(store.agencyEmployers)) {
          if (ae.agencyId === report.agency) ae.syncStatus = 'STALE';
        }
        const saved = await ingestScrapedRecords(records, report, { store, persist: false, syncRemote: false });
        reportEntry.positionsSaved = saved.savedPositions;
        for (const pos of Object.values(store.positions)) {
          const ae = store.agencyEmployers[pos.agencyEmployerId];
          if (ae?.agencyId !== report.agency || pos.isStale) continue;
          const firstSeen = priorFirstSeen.get(`${ae.agencyId}|${ae.sourceUrl.trim()}|${pos.positionName}`);
          if (firstSeen) pos.firstSeenAt = firstSeen;
        }
        // A rebuild is an observation baseline, not proof that the source just added a job.
        for (const snapshot of store.snapshots) {
          const pos = store.positions[snapshot.positionId];
          const ae = pos && store.agencyEmployers[pos.agencyEmployerId];
          if (ae?.agencyId === report.agency && !pos.isStale) snapshot.baseline = true;
        }
      }
    }
  }
  const audit = { checkedAt: new Date().toISOString(), scope: 'Full local store profile; live connector crawl; no Supabase or messaging writes', appliedLocally: apply, before, after: profile(store), reports };
  fs.mkdirSync('data/system-audit', { recursive: true });
  fs.writeFileSync('data/system-audit/latest.json', JSON.stringify(audit, null, 2));
  fs.writeFileSync('data/system-audit/records.json', JSON.stringify(allRecords, null, 2));
  if (apply) saveLocalStore(store);
  console.log('Audit saved: data/system-audit/latest.json');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

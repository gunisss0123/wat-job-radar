import fs from 'fs';
import path from 'path';
import type {
  CoverageReport,
  Employer,
  AgencyEmployer,
  Position,
  Housing,
  JobSnapshot,
  SyncRun,
  SourceHealth,
  ScrapedJobRecord,
  HealthStatus
} from './types';
import { canonicalEmployer } from './normalize';
import { slug } from './common';
import { adminDb } from './db';

const LOCAL_STORE_PATH = path.join(process.cwd(), 'data', 'wat-radar-store.json');

export interface RadarStoreData {
  employers: Record<string, Employer>;
  agencyEmployers: Record<string, AgencyEmployer>;
  positions: Record<string, Position>;
  housing: Record<string, Housing>;
  snapshots: JobSnapshot[];
  syncRuns: SyncRun[];
  sourceHealth: Record<string, SourceHealth>;
  discoveredUrls: Record<string, string[]>;
  lastUpdated: string;
}

export function loadLocalStore(): RadarStoreData {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const content = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.discoveredUrls) parsed.discoveredUrls = {};
      return parsed;
    }
  } catch (e) {
    console.error('Error reading local store, starting fresh', e);
  }
  return {
    employers: {},
    agencyEmployers: {},
    positions: {},
    housing: {},
    snapshots: [],
    syncRuns: [],
    sourceHealth: {},
    discoveredUrls: {},
    lastUpdated: new Date().toISOString()
  };
}

export function saveLocalStore(data: RadarStoreData): void {
  const dir = path.dirname(LOCAL_STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Ingests scraped records from a connector into both local store and Supabase (if configured)
 */
export async function ingestScrapedRecords(
  records: ScrapedJobRecord[],
  report: CoverageReport
): Promise<{
  savedPositions: number;
  newSnapshots: number;
  report: CoverageReport;
}> {
  const store = loadLocalStore();
  const now = new Date().toISOString();
  const agencyId = report.agency;

  let savedPositions = 0;
  let newSnapshots = 0;

  const currentSyncPositionIds = new Set<string>();
  const currentSyncAgencyEmployerIds = new Set<string>();

  for (const item of records) {
    // 1. Resolve canonical employer
    const canon = canonicalEmployer(item.employer, item.city, item.state);

    if (!store.employers[canon.id]) {
      store.employers[canon.id] = {
        id: canon.id,
        canonicalName: canon.canonicalName,
        city: canon.city,
        state: canon.state,
        area: canon.area,
        imageUrl: item.imageUrl,
        aliases: [item.employer],
        createdAt: now,
        updatedAt: now
      };
    } else {
      const emp = store.employers[canon.id];
      if (!emp.aliases.includes(item.employer)) emp.aliases.push(item.employer);
      if (!emp.area && canon.area) emp.area = canon.area;
      if (!emp.imageUrl && item.imageUrl) emp.imageUrl = item.imageUrl;
      emp.updatedAt = now;
    }

    // 2. Resolve agency employer
    const agencyEmployerId = slug(`${item.agency}-${item.sourceId || canon.id}`);
    currentSyncAgencyEmployerIds.add(agencyEmployerId);

    const prevAgencyEmp = store.agencyEmployers[agencyEmployerId];
    store.agencyEmployers[agencyEmployerId] = {
      id: agencyEmployerId,
      employerId: canon.id,
      agencyId: item.agency,
      sourceEmployerName: item.employer,
      sourceUrl: item.sourceUrl,
      imageUrl: item.imageUrl || prevAgencyEmp?.imageUrl,
      sourceId: item.sourceId,
      season: item.season,
      programStatus: item.programStatus,
      startDateText: item.startDateText,
      endDateText: item.endDateText,
      locationRaw: item.locationRaw,
      firstSeenAt: prevAgencyEmp?.firstSeenAt || now,
      lastSeenAt: now,
      missingRuns: 0,
      syncStatus: 'ACTIVE'
    };

    // 3. Housing
    if (item.housing) {
      const housingId = `housing-${agencyEmployerId}`;
      store.housing[housingId] = {
        id: housingId,
        agencyEmployerId,
        weeklyCost: item.housing.weeklyCost,
        housingText: item.housing.housingText,
        deposit: item.housing.deposit,
        depositText: item.housing.depositText,
        mealsIncluded: item.housing.mealsIncluded || false,
        mealsPerDay: item.housing.mealsPerDay,
        mealsText: item.housing.mealsText,
        transportationText: item.housing.transportationText,
        createdAt: store.housing[housingId]?.createdAt || now,
        updatedAt: now
      };
    }

    // 4. Granular Position
    const positionSlug = slug(item.position.name);
    const positionId = `${agencyEmployerId}-${positionSlug}`;
    currentSyncPositionIds.add(positionId);

    const prevPos = store.positions[positionId];
    const isNew = !prevPos;

    store.positions[positionId] = {
      id: positionId,
      agencyEmployerId,
      positionName: item.position.name,
      canonicalCategory: item.position.category,
      wageHourly: item.position.wageHourly,
      wageMax: item.position.wageMax,
      wageText: item.position.wageText,
      tips: item.position.tips || false,
      tipsText: item.position.tipsText,
      hoursMin: item.position.hoursMin,
      hoursMax: item.position.hoursMax,
      hoursText: item.position.hoursText,
      availableSlots: item.position.availableSlots,
      slotType: item.position.slotType,
      rawSlotText: item.position.rawSlotText,
      availabilityText: item.position.availabilityText,
      status: item.position.status,
      englishLevel: item.position.englishLevel,
      firstSeenAt: prevPos?.firstSeenAt || now,
      lastSeenAt: now,
      missingRuns: 0,
      isStale: false
    };
    savedPositions++;

    // 5. Snapshot delta check
    const shouldSnapshot =
      isNew ||
      prevPos.availableSlots !== item.position.availableSlots ||
      prevPos.wageHourly !== item.position.wageHourly ||
      prevPos.status !== item.position.status;

    if (shouldSnapshot) {
      store.snapshots.push({
        positionId,
        availableSlots: item.position.availableSlots,
        wageHourly: item.position.wageHourly,
        status: item.position.status,
        capturedAt: now
      });
      newSnapshots++;
    }
  }

  // 6. Handle staleness for missing items of this agency
  for (const [posId, pos] of Object.entries(store.positions)) {
    const parentAgencyEmp = store.agencyEmployers[pos.agencyEmployerId];
    if (parentAgencyEmp && parentAgencyEmp.agencyId === agencyId) {
      if (!currentSyncPositionIds.has(posId)) {
        pos.missingRuns = (pos.missingRuns || 0) + 1;
        if (pos.missingRuns >= 3) pos.isStale = true;
      }
    }
  }

  for (const [aeId, ae] of Object.entries(store.agencyEmployers)) {
    if (ae.agencyId === agencyId) {
      if (!currentSyncAgencyEmployerIds.has(aeId)) {
        ae.missingRuns = (ae.missingRuns || 0) + 1;
        if (ae.missingRuns >= 10) ae.syncStatus = 'ARCHIVED';
        else if (ae.missingRuns >= 3) ae.syncStatus = 'STALE';
        else if (ae.missingRuns >= 2) ae.syncStatus = 'SUSPECT';
      }
    }
  }

  // 7. Calculate source health
  let lastStatus: HealthStatus = 'Healthy';
  if (report.coveragePct === 0) lastStatus = 'Error';
  else if (report.failedPages > 0 && report.coveragePct < 95) lastStatus = 'Partial';
  else if (report.failedPages > 0) lastStatus = 'Warning';

  const agencyPositions = Object.values(store.positions).filter(p => {
    const ae = store.agencyEmployers[p.agencyEmployerId];
    return ae && ae.agencyId === agencyId && !p.isStale;
  });

  const activeSlotsCount = agencyPositions.filter(p => (p.availableSlots ?? 1) > 0 && p.status !== 'FULL' && p.status !== 'CLOSED').length;

  store.sourceHealth[agencyId] = {
    agencyId,
    connectorType: report.connectorType,
    lastSyncAt: now,
    lastStatus,
    lastCoveragePct: report.coveragePct,
    employersCount: report.employersFound,
    positionsCount: agencyPositions.length,
    activePositionsCount: activeSlotsCount,
    lastError: report.failedPages > 0 ? `${report.failedPages} pages failed` : undefined,
    updatedAt: now
  };

  // 8. Record Sync Run
  const syncRun: SyncRun = {
    agencyId,
    connectorType: report.connectorType,
    discoveryCount: report.employersFound,
    detailPagesFetched: report.detailPagesFetched,
    detailPagesParsed: report.detailPagesParsed,
    positionsFound: report.positionsFound,
    positionsSaved: savedPositions,
    failedPages: report.failedPages,
    failedUrls: (report.failedUrls || []).map(f => typeof f === 'string' ? f : `${f.url}: ${f.error}`),
    coveragePct: report.parseCoveragePct,
    durationMs: report.durationMs,
    status: report.status,
    startedAt: new Date(Date.now() - report.durationMs).toISOString(),
    finishedAt: now
  };
  store.syncRuns.unshift(syncRun);
  if (store.syncRuns.length > 50) store.syncRuns.pop();

  if (!store.discoveredUrls) store.discoveredUrls = {};
  store.discoveredUrls[agencyId] = [...new Set(records.map(r => r.sourceUrl))];

  store.lastUpdated = now;
  saveLocalStore(store);

  // 9. Sync to Supabase if configured
  try {
    const db = adminDb();
    if (db) {
      // Upsert employers
      const empRows = Object.values(store.employers).map(e => ({
        id: e.id,
        canonical_name: e.canonicalName,
        city: e.city,
        state: e.state,
        area: e.area,
        address: e.address,
        latitude: e.latitude,
        longitude: e.longitude,
        aliases: e.aliases,
        updated_at: now
      }));
      if (empRows.length) await db.from('employers').upsert(empRows, { onConflict: 'id' });

      // Upsert agency employers
      const aeRows = Object.values(store.agencyEmployers).map(ae => ({
        id: ae.id,
        employer_id: ae.employerId,
        agency_id: ae.agencyId,
        source_employer_name: ae.sourceEmployerName,
        source_url: ae.sourceUrl,
        source_id: ae.sourceId,
        season: ae.season,
        program_status: ae.programStatus,
        start_date_text: ae.startDateText,
        end_date_text: ae.endDateText,
        location_raw: ae.locationRaw,
        last_seen_at: ae.lastSeenAt,
        missing_runs: ae.missingRuns,
        sync_status: ae.syncStatus
      }));
      if (aeRows.length) await db.from('agency_employers').upsert(aeRows, { onConflict: 'id' });

      // Upsert positions
      const posRows = Object.values(store.positions).map(p => ({
        id: p.id,
        agency_employer_id: p.agencyEmployerId,
        position_name: p.positionName,
        canonical_category: p.canonicalCategory,
        wage_hourly: p.wageHourly,
        wage_max: p.wageMax,
        wage_text: p.wageText,
        tips: p.tips,
        tips_text: p.tipsText,
        hours_min: p.hoursMin,
        hours_max: p.hoursMax,
        hours_text: p.hoursText,
        available_slots: p.availableSlots,
        availability_text: p.availabilityText,
        status: p.status,
        english_level: p.englishLevel,
        last_seen_at: p.lastSeenAt,
        missing_runs: p.missingRuns,
        is_stale: p.isStale
      }));
      if (posRows.length) await db.from('positions').upsert(posRows, { onConflict: 'id' });

      // Record Sync Run in Supabase
      await db.from('sync_runs').insert({
        agency_id: syncRun.agencyId,
        connector_type: syncRun.connectorType,
        discovery_count: syncRun.discoveryCount,
        detail_pages_fetched: syncRun.detailPagesFetched,
        detail_pages_parsed: syncRun.detailPagesParsed,
        positions_found: syncRun.positionsFound,
        positions_saved: syncRun.positionsSaved,
        failed_pages: syncRun.failedPages,
        failed_urls: syncRun.failedUrls,
        coverage_pct: syncRun.coveragePct,
        duration_ms: syncRun.durationMs,
        status: syncRun.status,
        started_at: syncRun.startedAt,
        finished_at: syncRun.finishedAt
      });

      // Update Source Health in Supabase
      await db.from('source_health').upsert({
        agency_id: agencyId,
        connector_type: report.connectorType,
        last_sync_at: now,
        last_status: lastStatus,
        last_coverage_pct: report.coveragePct,
        employers_count: report.employersFound,
        positions_count: agencyPositions.length,
        active_positions_count: activeSlotsCount,
        last_error: syncRun.errorText || (report.failedPages > 0 ? `${report.failedPages} pages failed` : null),
        updated_at: now
      }, { onConflict: 'agency_id' });
    }
  } catch (err) {
    console.warn('[Engine] Supabase remote sync warning:', (err as any)?.message || err);
  }

  report.positionsSaved = savedPositions;
  return { savedPositions, newSnapshots, report };
}

import { createClient } from '@supabase/supabase-js';
import type { Job, JobEvent, SourceRun } from './types';
import { loadLocalStore } from './engine';
import { enrichForProfile } from './profile';
import { snapshotEvents } from './history';

function url() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

export function publicDb() {
  const u = url(), k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return u && k ? createClient(u, k, { auth: { persistSession: false } }) : null;
}

export function adminDb() {
  const u = url(), k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return u && k ? createClient(u, k, { auth: { persistSession: false } }) : null;
}

function fromRow(r: any): Job {
  return {
    id: r.id,
    agency: r.agency,
    employer: r.employer,
    season: r.season,
    state: r.state,
    city: r.city,
    locationText: r.location_text,
    position: r.position,
    category: r.category,
    wageMin: r.wage_min,
    wageMax: r.wage_max,
    wageText: r.wage_text,
    housingWeekly: r.housing_weekly,
    housingText: r.housing_text,
    mealsIncluded: r.meals_included,
    mealsText: r.meals_text,
    hoursMin: r.hours_min,
    hoursMax: r.hours_max,
    hoursText: r.hours_text,
    availableSlots: r.available_slots,
    availabilityText: r.availability_text,
    status: r.status,
    startText: r.start_text,
    endText: r.end_text,
    englishFit: r.english_fit,
    secondJobFit: r.second_job_fit,
    natureFit: r.nature_fit,
    employerFit: r.employer_fit,
    socialFit: r.social_fit,
    group3Fit: r.group3_fit,
    valueFit: r.value_fit,
    fitScore: r.fit_score,
    sourceUrl: r.source_url,
    imageUrl: r.image_url,
    firstSeenAt: r.first_seen_at,
    lastSeenAt: r.last_seen_at,
    notes: r.notes
  };
}

function toRow(j: Job) {
  return {
    id: j.id,
    agency: j.agency,
    employer: j.employer,
    season: j.season,
    state: j.state,
    city: j.city,
    location_text: j.locationText,
    position: j.position,
    category: j.category,
    wage_min: j.wageMin,
    wage_max: j.wageMax,
    wage_text: j.wageText,
    housing_weekly: j.housingWeekly,
    housing_text: j.housingText,
    meals_included: j.mealsIncluded,
    meals_text: j.mealsText,
    hours_min: j.hoursMin,
    hours_max: j.hoursMax,
    hours_text: j.hoursText,
    available_slots: j.availableSlots,
    availability_text: j.availabilityText,
    status: j.status,
    start_text: j.startText,
    end_text: j.endText,
    english_fit: j.englishFit,
    second_job_fit: j.secondJobFit,
    nature_fit: j.natureFit,
    employer_fit: j.employerFit,
    social_fit: j.socialFit,
    group3_fit: j.group3Fit,
    value_fit: j.valueFit,
    fit_score: j.fitScore,
    source_url: j.sourceUrl,
    image_url: j.imageUrl,
    last_seen_at: j.lastSeenAt,
    raw_text: j.rawText,
    notes: j.notes,
    is_stale: false,
    missing_runs: 0
  };
}

let memoryCachedJobs: Job[] | null = null;
let lastCacheTime = 0;

export async function getJobs(): Promise<Job[]> {
  const now = Date.now();
  if (memoryCachedJobs && now - lastCacheTime < 60000) {
    return memoryCachedJobs;
  }

  const db = Object.keys(loadLocalStore().positions).length ? null : publicDb();
  if (db) {
    const { data, error } = await db.from('wat_jobs').select('*').eq('is_hidden', false).eq('is_stale', false).order('fit_score', { ascending: false });
    if (!error && data) return data.map(fromRow);
  }

  // Load from local store (crawled data)
  const store = loadLocalStore();
  const posValues = Object.values(store.positions);
  if (posValues.length > 0) {
    const realJobs: Job[] = [];
    for (const pos of posValues) {
      if (pos.isStale) continue;
      const ae = store.agencyEmployers[pos.agencyEmployerId];
      if (!ae) continue;
      const emp = store.employers[ae.employerId];
      const housing = store.housing[`housing-${ae.id}`];

      realJobs.push(enrichForProfile({
        id: pos.id,
        agency: ae.agencyId,
        employer: emp?.canonicalName || ae.sourceEmployerName,
        season: ae.season,
        state: emp?.state,
        city: emp?.city,
        locationText: ae.locationRaw || [emp?.city, emp?.state].filter(Boolean).join(', '),
        position: pos.positionName,
        category: pos.canonicalCategory,
        slotType: pos.slotType,
        wageMin: pos.wageHourly,
        wageMax: pos.wageMax,
        wageText: pos.wageText,
        housingWeekly: housing?.weeklyCost,
        housingText: housing?.housingText,
        mealsIncluded: housing?.mealsIncluded,
        mealsText: housing?.mealsText,
        hoursMin: pos.hoursMin,
        hoursMax: pos.hoursMax,
        hoursText: pos.hoursText,
        availableSlots: pos.availableSlots,
        availabilityText: pos.availabilityText || pos.rawSlotText,
        status: pos.status,
        startText: ae.startDateText,
        endText: ae.endDateText,
        englishFit: pos.englishLevel,
        notes: ae.sourceNotes,
        sourceUrl: ae.sourceUrl,
        imageUrl: ae.imageUrl || emp?.imageUrl,
        firstSeenAt: pos.firstSeenAt,
        lastSeenAt: pos.lastSeenAt
      }));
    }
    const sorted = realJobs.sort((a, b) => {
      const timeB = new Date(b.firstSeenAt || b.lastSeenAt || 0).getTime();
      const timeA = new Date(a.firstSeenAt || a.lastSeenAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.fitScore || 0) - (a.fitScore || 0);
    });
    memoryCachedJobs = sorted;
    lastCacheTime = now;
    return sorted;
  }

  return [];
}

export async function getEvents(limit = 100): Promise<JobEvent[]> {
  const db = loadLocalStore().snapshots.length ? null : publicDb();
  if (db) {
    const { data } = await db.from('wat_job_events').select('*').order('created_at', { ascending: false }).limit(limit);
    if (data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id,
        jobId: r.job_id,
        agency: r.agency,
        employer: r.employer,
        position: r.position,
        eventType: r.event_type,
        beforeValue: r.before_value,
        afterValue: r.after_value,
        createdAt: r.created_at
      }));
    }
  }

  const store = loadLocalStore();
  if (store.snapshots.length > 0) {
    return snapshotEvents(store.snapshots).filter(s => !store.positions[s.positionId]?.isStale).slice(-limit).reverse().map((s, idx) => {
      const pos = store.positions[s.positionId];
      const ae = pos ? store.agencyEmployers[pos.agencyEmployerId] : undefined;
      return {
        id: idx + 1,
        jobId: s.positionId,
        agency: ae?.agencyId || 'OEG',
        employer: ae?.sourceEmployerName || 'Employer',
        position: pos?.positionName,
        eventType: s.eventType,
        beforeValue: s.beforeValue,
        afterValue: s.afterValue,
        createdAt: s.capturedAt
      };
    });
  }

  return [];
}

export async function getSourceRuns(): Promise<SourceRun[]> {
  const db = Object.keys(loadLocalStore().sourceHealth).length ? null : publicDb();
  if (db) {
    const { data } = await db.from('wat_source_runs').select('*').order('ran_at', { ascending: false }).limit(40);
    if (data && data.length > 0) {
      const seen = new Set<string>();
      const out: SourceRun[] = [];
      for (const r of data) {
        if (seen.has(r.source)) continue;
        seen.add(r.source);
        out.push({
          id: r.id,
          source: r.source,
          health: r.health,
          jobCount: r.job_count,
          durationMs: r.duration_ms,
          errorText: r.error_text,
          ranAt: r.ran_at
        });
      }
      return out;
    }
  }

  const store = loadLocalStore();
  const shValues = Object.values(store.sourceHealth);
  if (shValues.length > 0) {
    return shValues.map((sh, idx) => ({
      id: idx + 1,
      source: sh.agencyId,
      health: sh.lastStatus === 'Healthy' ? 'OK' : 'ERROR',
      jobCount: sh.positionsCount,
      errorText: sh.lastError,
      ranAt: sh.lastSyncAt || sh.updatedAt
    }));
  }

  return [];
}

export async function saveRun(jobs: Job[], run: SourceRun) {
  const db = adminDb();
  if (!db) return { saved: jobs.length, events: 0 };
  const ids = jobs.map(j => j.id);
  let existing: any[] = [];
  if (ids.length) {
    const { data } = await db.from('wat_jobs').select('*').in('id', ids);
    existing = data || [];
  }
  const old = new Map(existing.map((r: any) => [r.id, r]));
  const events: any[] = [];
  for (const j of jobs) {
    const p = old.get(j.id);
    if (!p) events.push(event(j, 'NEW_JOB', undefined, 'first seen'));
    else {
      if (p.status !== j.status) events.push(event(j, 'STATUS_CHANGE', p.status, j.status));
      if (p.available_slots !== j.availableSlots) events.push(event(j, 'SLOT_CHANGE', String(p.available_slots ?? 'unknown'), String(j.availableSlots ?? 'unknown')));
      if (p.wage_text !== j.wageText) events.push(event(j, 'WAGE_CHANGE', p.wage_text, j.wageText));
      if (p.housing_text !== j.housingText) events.push(event(j, 'HOUSING_CHANGE', p.housing_text, j.housingText));
    }
  }
  if (jobs.length) {
    const { error } = await db.from('wat_jobs').upsert(jobs.map(toRow), { onConflict: 'id' });
    if (error) console.warn('[DB] upsert warning:', error.message);
  }
  if (run.health === 'OK') {
    const { data: sourceRows } = await db.from('wat_jobs').select('id,missing_runs').eq('agency', run.source);
    const seen = new Set(ids);
    const missing = (sourceRows || []).filter((r: any) => !seen.has(r.id));
    for (const r of missing) {
      const n = (r.missing_runs || 0) + 1;
      await db.from('wat_jobs').update({ missing_runs: n, is_stale: n >= 3 }).eq('id', r.id);
    }
  }
  if (events.length) await db.from('wat_job_events').insert(events);
  await db.from('wat_source_runs').insert({
    source: run.source,
    health: run.health,
    job_count: run.jobCount,
    duration_ms: run.durationMs,
    error_text: run.errorText,
    ran_at: run.ranAt
  });
  return { saved: jobs.length, events: events.length };
}

function event(j: Job, type: string, before?: string, after?: string) {
  return {
    job_id: j.id,
    agency: j.agency,
    employer: j.employer,
    position: j.position,
    event_type: type,
    before_value: before,
    after_value: after,
    created_at: new Date().toISOString()
  };
}

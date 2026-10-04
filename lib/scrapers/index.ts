import type { Job, SourceRun, ScrapedJobRecord, CoverageReport, AgencyId } from '../types';
import { scrapeOEG } from './oeg';
import { scrapeIEE } from './iee';
import { scrapeAcadex } from './acadex';
import { scrapeNewStep } from './newstep';
import { scrapeALC } from './alc';
import { scrapeIHappy } from './ihappy';
import { enrichForProfile } from '../profile';
import { slug } from '../common';
import { ingestScrapedRecords } from '../engine';

export type ScraperName = 'OEG' | 'New Step' | 'ALC' | 'IEE' | 'iHappy' | 'ACADEX';

export function scrapedRecordToLegacyJob(record: ScrapedJobRecord): Job {
  return {
    id: slug(`${record.agency}-${record.sourceId || record.employer}-${record.position.name}`),
    agency: record.agency,
    employer: record.employer,
    season: record.season,
    state: record.state,
    city: record.city,
    locationText: `${record.city || ''}, ${record.state || ''}`.trim(),
    position: record.position.name,
    category: record.position.category || 'OTHER',
    wageMin: record.position.wageHourly,
    wageMax: record.position.wageMax,
    wageText: record.position.wageText,
    housingWeekly: record.housing?.weeklyCost,
    housingText: record.housing?.housingText,
    mealsIncluded: record.housing?.mealsIncluded,
    availableSlots: record.position.availableSlots,
    availabilityText: record.position.availabilityText || record.position.rawSlotText,
    status: record.position.status,
    startText: record.startDateText,
    endText: record.endDateText,
    englishFit: record.position.englishLevel,
    sourceUrl: record.sourceUrl,
    imageUrl: record.imageUrl,
    lastSeenAt: record.scrapedAt
  };
}

export async function runScraper(name: ScraperName): Promise<{ jobs: Job[]; run: SourceRun; report?: CoverageReport }> {
  const started = Date.now();
  try {
    if (name === 'OEG') {
      const { records, report } = await scrapeOEG(5);
      await ingestScrapedRecords(records, report);
      const jobs = records.map(scrapedRecordToLegacyJob).map(enrichForProfile);
      return {
        jobs,
        run: {
          source: name,
          health: report.failedPages === 0 ? 'OK' : 'ERROR',
          jobCount: records.length,
          durationMs: Date.now() - started,
          ranAt: new Date().toISOString()
        },
        report
      };
    }

    if (name === 'New Step') {
      const { records, report } = await scrapeNewStep(8);
      await ingestScrapedRecords(records, report);
      const jobs = records.map(scrapedRecordToLegacyJob).map(enrichForProfile);
      return {
        jobs,
        run: {
          source: name,
          health: report.failedPages === 0 ? 'OK' : 'ERROR',
          jobCount: records.length,
          durationMs: Date.now() - started,
          ranAt: new Date().toISOString()
        },
        report
      };
    }

    if (name === 'ALC') {
      const { records, report } = await scrapeALC();
      await ingestScrapedRecords(records, report);
      const jobs = records.map(scrapedRecordToLegacyJob).map(enrichForProfile);
      return {
        jobs,
        run: {
          source: name,
          health: report.failedPages === 0 ? 'OK' : 'ERROR',
          jobCount: records.length,
          durationMs: Date.now() - started,
          ranAt: new Date().toISOString()
        },
        report
      };
    }

    if (name === 'IEE') {
      const { records, report } = await scrapeIEE();
      await ingestScrapedRecords(records, report);
      const jobs = records.map(scrapedRecordToLegacyJob).map(enrichForProfile);
      return {
        jobs,
        run: {
          source: name,
          health: report.failedPages === 0 ? 'OK' : 'ERROR',
          jobCount: records.length,
          durationMs: Date.now() - started,
          ranAt: new Date().toISOString()
        },
        report
      };
    }

    if (name === 'iHappy') {
      const { records, report } = await scrapeIHappy();
      await ingestScrapedRecords(records, report);
      const jobs = records.map(scrapedRecordToLegacyJob).map(enrichForProfile);
      return {
        jobs,
        run: {
          source: name,
          health: report.failedPages === 0 ? 'OK' : 'ERROR',
          jobCount: records.length,
          durationMs: Date.now() - started,
          ranAt: new Date().toISOString()
        },
        report
      };
    }

    let rawJobs: Job[] = [];
    if (name === 'ACADEX') rawJobs = await scrapeAcadex();
    const jobs = rawJobs.map(enrichForProfile);
    return {
      jobs,
      run: {
        source: name,
        health: 'OK',
        jobCount: jobs.length,
        durationMs: Date.now() - started,
        ranAt: new Date().toISOString()
      }
    };
  } catch (e: any) {
    return {
      jobs: [],
      run: {
        source: name,
        health: 'ERROR',
        jobCount: 0,
        durationMs: Date.now() - started,
        errorText: String(e),
        ranAt: new Date().toISOString()
      }
    };
  }
}

export const scrapers: Record<ScraperName, () => Promise<any>> = {
  OEG: scrapeOEG,
  'New Step': scrapeNewStep,
  ALC: scrapeALC,
  IEE: scrapeIEE,
  iHappy: scrapeIHappy,
  ACADEX: scrapeAcadex
};

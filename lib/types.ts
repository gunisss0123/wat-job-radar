export type AgencyId = 'OEG' | 'New Step' | 'ACADEX' | 'IEE' | 'iHappy' | string;
export type ConnectorType = 'API' | 'EMBEDDED_JSON' | 'HTML' | 'BROWSER' | 'TBD';

export type JobStatus =
  | 'OPEN'
  | 'LOW_SLOTS'
  | 'LIMITED'
  | 'FULL'
  | 'COMING_SOON'
  | 'PRE_PLACEMENT'
  | 'CONFIRMED'
  | 'PENDING'
  | 'CLOSED'
  | 'UNKNOWN';

export type JobCategory =
  | 'KITCHEN_BOH'
  | 'FOOD_BOH'
  | 'FOOD_FOH'
  | 'HOUSEKEEPING'
  | 'ATTRACTION'
  | 'RETAIL'
  | 'OTHER';

export type HealthStatus = 'Healthy' | 'Warning' | 'Partial' | 'Error' | 'Connector Needed';
export type SourceHealthLegacy = 'OK' | 'ERROR' | 'MANUAL';

export type Job = {
  id: string;
  agency: string;
  employer: string;
  season: string;
  state?: string;
  city?: string;
  locationText?: string;
  position?: string;
  category?: JobCategory;
  wageMin?: number;
  wageMax?: number;
  wageText?: string;
  housingWeekly?: number;
  housingText?: string;
  mealsIncluded?: boolean;
  mealsText?: string;
  hoursMin?: number;
  hoursMax?: number;
  hoursText?: string;
  availableSlots?: number | null;
  availabilityText?: string;
  status: JobStatus;
  startText?: string;
  endText?: string;
  englishFit?: string;
  secondJobFit?: number;
  natureFit?: number;
  employerFit?: number;
  socialFit?: number;
  group3Fit?: number;
  valueFit?: number;
  fitScore?: number;
  sourceUrl: string;
  imageUrl?: string;
  firstSeenAt?: string;
  lastSeenAt: string;
  rawText?: string;
  notes?: string;
};

export type JobEvent = {
  id: number;
  jobId: string;
  agency: string;
  employer: string;
  position?: string;
  eventType: 'NEW_JOB'|'STATUS_CHANGE'|'SLOT_CHANGE'|'WAGE_CHANGE'|'HOUSING_CHANGE';
  beforeValue?: string;
  afterValue?: string;
  createdAt: string;
};

export type SourceRun = {
  id?: number;
  source: string;
  health: SourceHealthLegacy;
  jobCount: number;
  durationMs?: number;
  errorText?: string;
  ranAt: string;
};


export type SlotSemanticType = 'EXACT' | 'AT_LEAST' | 'AT_MOST' | 'FULL' | 'UNKNOWN';

/**
 * Granular scraped position returned by an Agency connector
 */
export interface ScrapedPositionItem {
  name: string;
  category?: JobCategory;
  wageHourly?: number;
  wageMax?: number;
  wageText?: string;
  tips?: boolean;
  tipsText?: string;
  hoursMin?: number;
  hoursMax?: number;
  hoursText?: string;
  availableSlots?: number | null;
  slotType?: SlotSemanticType;
  rawSlotText?: string;
  availabilityText?: string;
  englishLevel?: string;
  status: JobStatus;
}

export interface ScrapedHousing {
  weeklyCost?: number;
  housingText?: string;
  deposit?: number;
  depositText?: string;
  mealsIncluded?: boolean;
  mealsPerDay?: number;
  mealsText?: string;
  transportationText?: string;
}

export interface ScrapedJobRecord {
  agency: AgencyId;
  employer: string;
  sourceId?: string;
  city?: string;
  state?: string;
  area?: string;
  season: string;
  programStatus?: string;
  startDateText?: string;
  endDateText?: string;
  locationRaw?: string;
  position: ScrapedPositionItem;
  housing?: ScrapedHousing;
  sourceUrl: string;
  imageUrl?: string;
  scrapedAt: string;
}

/**
 * Discovered Employer link before detail crawl
 */
export interface DiscoveredEmployer {
  agency: AgencyId;
  sourceId?: string;
  name: string;
  city?: string;
  state?: string;
  imageUrl?: string;
  detailUrl: string;
}

/**
 * Relational DB Entities
 */
export interface Agency {
  id: AgencyId;
  name: string;
  website: string;
  connectorType: ConnectorType;
  isActive: boolean;
  createdAt: string;
}

export interface Employer {
  id: string; // canonical slug
  canonicalName: string;
  city?: string;
  state?: string;
  area?: string;
  address?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgencyEmployer {
  id: string; // e.g. 'oeg-65'
  employerId: string;
  agencyId: AgencyId;
  sourceEmployerName: string;
  sourceUrl: string;
  imageUrl?: string;
  sourceId?: string;
  season: string;
  programStatus?: string;
  startDateText?: string;
  endDateText?: string;
  locationRaw?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  missingRuns: number;
  syncStatus: 'ACTIVE' | 'SUSPECT' | 'STALE' | 'ARCHIVED';
}

export interface Housing {
  id: string;
  agencyEmployerId: string;
  weeklyCost?: number;
  housingText?: string;
  deposit?: number;
  depositText?: string;
  mealsIncluded: boolean;
  mealsPerDay?: number;
  mealsText?: string;
  transportationText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  agencyEmployerId: string;
  positionName: string;
  canonicalCategory?: JobCategory;
  wageHourly?: number;
  wageMax?: number;
  wageText?: string;
  tips: boolean;
  tipsText?: string;
  hoursMin?: number;
  hoursMax?: number;
  hoursText?: string;
  availableSlots?: number | null;
  slotType?: SlotSemanticType;
  rawSlotText?: string;
  availabilityText?: string;
  status: JobStatus;
  englishLevel?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  missingRuns: number;
  isStale: boolean;
}

export interface JobSnapshot {
  id?: number;
  positionId: string;
  availableSlots?: number | null;
  wageHourly?: number;
  status: JobStatus;
  capturedAt: string;
}

export interface SyncRun {
  id?: number;
  agencyId: AgencyId;
  connectorType: ConnectorType;
  discoveryCount: number;
  detailPagesFetched: number;
  detailPagesParsed: number;
  positionsFound: number;
  positionsSaved: number;
  failedPages: number;
  failedUrls: string[];
  coveragePct: number;
  durationMs: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  errorText?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface SourceHealth {
  agencyId: AgencyId;
  connectorType: ConnectorType;
  lastSyncAt?: string;
  lastStatus: HealthStatus;
  lastCoveragePct: number;
  employersCount: number;
  positionsCount: number;
  activePositionsCount: number;
  lastError?: string;
  updatedAt: string;
}

export interface FailedUrlItem {
  url: string;
  error: string;
}

export interface SlotTypeStats {
  exactNumeric: number;
  moreThanX: number;
  upToX: number;
  full: number;
  unknown: number;
}

export interface CoverageReport {
  agency: AgencyId;
  connectorType: ConnectorType;
  season: string;
  indexPagesDiscovered: number;
  jobUrlsFound: number;
  uniqueJobUrls: number;
  duplicateUrls: number;
  employersFound: number;
  detailPagesFetched: number;
  detailPagesParsed: number;
  positionsFound: number;
  positionsSaved: number;
  failedPages: number;
  failedUrls: FailedUrlItem[];
  discoveryCoveragePct: number;
  parseCoveragePct: number;
  coveragePct: number;
  slotTypes: SlotTypeStats;
  durationMs: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  anomalyWarning?: string;
}


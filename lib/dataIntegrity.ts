import { slug } from './common';
import type { JobStatus, SlotSemanticType } from './types';

const STATE_CODES = 'AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|DC:District of Columbia';
export function normalizeUSState(raw?: string): string | undefined {
  const text = raw?.trim().replace(/\s*\([A-Z]{2}\)\s*$/i, '').toLowerCase();
  if (!text) return undefined;
  const found = STATE_CODES.split('|').map(s => s.split(':')).find(([code, name]) => [code.toLowerCase(), name.toLowerCase()].includes(text));
  return found?.[1];
}

export function verifiedGroupCapacity(job: { status: JobStatus; availableSlots?: number | null; slotType?: SlotSemanticType }): number {
  if (!['OPEN', 'LOW_SLOTS', 'LIMITED'].includes(job.status)) return 0;
  if (!['EXACT', 'AT_LEAST'].includes(job.slotType || '')) return 0;
  return Number.isInteger(job.availableSlots) && job.availableSlots! > 0 ? job.availableSlots! : 0;
}

export function parseSourceDateRange(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (!value || typeof value !== 'object') return undefined;
  const range = value as { start?: unknown; end?: unknown };
  const parts = [range.start, range.end].filter((x): x is string => typeof x === 'string' && !!x.trim());
  if (!parts.length) return undefined;
  const text = [...new Set(parts)].join(' – ');
  return /20\d{2}/.test(text) ? text : `${text} (ต้นทางไม่ระบุปี)`;
}

export function seasonFromEvidence(season: string, ...evidence: (string | undefined)[]): string {
  const years = [...new Set(evidence.flatMap(s => s?.match(/\b20\d{2}\b/g) || []))];
  return years.length === 1 ? `${season} ${years[0]}` : `${season} (ไม่ระบุปี)`;
}

export function parseWeeklyCost(text?: string): number | undefined {
  if (!text || /not (?:yet )?finali[sz]ed|TBA|TBD|pending confirmation|ยังไม่.*(?:ยืนยัน|กำหนด)/i.test(text)) return undefined;
  const match = text.replace(/,/g, '').match(/\$?\s*(\d+(?:\.\d+)?)\s*(?:\+\s*tax)?\s*(?:\/|per\s+)(week|wk|day|month|สัปดาห์|เดือน|วัน)/i);
  if (!match) return /\bfree\b|ไม่มีค่า(?:ที่พัก|บ้าน)/i.test(text) ? 0 : undefined;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return Math.round((/day|วัน/.test(unit) ? amount * 7 : /month|เดือน/.test(unit) ? amount * 12 / 52 : amount) * 100) / 100;
}

export function canAgeMissingRecords(report: { status: string; failedPages: number; coveragePct: number; discoveryCoveragePct: number; anomalyWarning?: string }): boolean {
  return report.status === 'SUCCESS' && report.failedPages === 0 && report.coveragePct === 100 && report.discoveryCoveragePct === 100 && !report.anomalyWarning;
}

export function recordIdentity(record: { agency: string; sourceId?: string; sourceUrl: string; employer: string; season: string; city?: string; state?: string }): string {
  // Keep the offer URL in the key: separate groups/seasons must not overwrite each other.
  const source = record.sourceId || record.sourceUrl.trim();
  let hash = 2166136261;
  for (const char of `${source}|${record.sourceUrl.trim()}|${record.season}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${slug(record.agency)}-${(hash >>> 0).toString(16)}`;
}

export function positionIdentity(position: { name: string; sourceId?: string }): string {
  return slug(position.sourceId || position.name);
}

export function mealsFromEvidence(text?: string): boolean | undefined {
  if (!text) return undefined;
  if (/not included|no (?:free )?meals|ไม่รวมอาหาร/i.test(text)) return false;
  if (/meals? (?:are )?included|include[sd]?.*meals?|free meals?|รวมอาหาร|อาหารฟรี/i.test(text)) return true;
  if (/meals?[^]{0,100}(?:provided for|cost|charge)[^]{0,20}\$|discount|ส่วนลด|ซื้อ.*อาหาร/i.test(text)) return false;
  return undefined;
}

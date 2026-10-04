import type { JobCategory } from './types';
import { slug } from './common';

export interface CanonicalInfo {
  id: string;
  canonicalName: string;
  area?: string;
  city?: string;
  state?: string;
}

const ALIAS_MAP: Record<string, { canonical: string; area?: string }> = {
  'hap denali princess wilderness lodge': { canonical: 'Denali Princess Wilderness Lodge', area: 'Denali Area' },
  'hap denali princess wilderness lodge ciee': { canonical: 'Denali Princess Wilderness Lodge', area: 'Denali Area' },
  'denali princess wilderness lodge': { canonical: 'Denali Princess Wilderness Lodge', area: 'Denali Area' },
  'denali princess lodge': { canonical: 'Denali Princess Wilderness Lodge', area: 'Denali Area' },

  'hap holland america denali lodge': { canonical: 'Holland America Denali Lodge', area: 'Denali Area' },
  'holland america denali lodge': { canonical: 'Holland America Denali Lodge', area: 'Denali Area' },
  'hadl': { canonical: 'Holland America Denali Lodge', area: 'Denali Area' },

  'hap denali shared services healy homestead': { canonical: 'Denali Shared Services Healy Homestead', area: 'Denali Area' },
  'aramark denali park village': { canonical: 'Aramark Denali Park Village', area: 'Denali Area' },

  'hap mt mckinley princess wilderness lodge': { canonical: 'Mt. McKinley Princess Wilderness Lodge', area: 'Denali Area' },
  'hap mt mckinley princess wilderness lodge ciee': { canonical: 'Mt. McKinley Princess Wilderness Lodge', area: 'Denali Area' },
  'mckinley chalet resort': { canonical: 'McKinley Chalet Resort', area: 'Denali Area' },

  'cedar point amusement park': { canonical: 'Cedar Point Amusement Park', area: 'Sandusky / Lake Erie' },
  'cedar point resort': { canonical: 'Cedar Point Resort', area: 'Sandusky / Lake Erie' },
  'cedar point': { canonical: 'Cedar Point Amusement Park', area: 'Sandusky / Lake Erie' },

  'dorney park': { canonical: 'Dorney Park & Wildwater Kingdom', area: 'Lehigh Valley' },
  'dorney park and wildwater kingdom': { canonical: 'Dorney Park & Wildwater Kingdom', area: 'Lehigh Valley' },

  'wilderness resort spirit': { canonical: 'Wilderness Resort', area: 'Wisconsin Dells' },
  'wilderness resort': { canonical: 'Wilderness Resort', area: 'Wisconsin Dells' },
  'noahs ark waterpark': { canonical: 'Noah\'s Ark Waterpark', area: 'Wisconsin Dells' },

  'glacier park by pursuit apgar village': { canonical: 'Pursuit Glacier Park Collection - Apgar Village', area: 'Glacier National Park Area' },
  'glacier park by pursuit glacier park lodge': { canonical: 'Pursuit Glacier Park Collection - Glacier Park Lodge', area: 'Glacier National Park Area' },
  'glacier park by pursuit st mary village': { canonical: 'Pursuit Glacier Park Collection - St. Mary Village', area: 'Glacier National Park Area' },
  'xanterra parks & resorts glacier park lodges': { canonical: 'Xanterra Glacier National Park Lodges', area: 'Glacier National Park Area' },

  'xanterra yellowstone national park lodges': { canonical: 'Xanterra Yellowstone National Park Lodges', area: 'Yellowstone Area' },
  'aramark yosemite national park': { canonical: 'Aramark Yosemite National Park', area: 'Yosemite Area' }
};

export function cleanEmployerName(raw: string): string {
  return raw
    .replace(/^\s*\((?:Spring|Summer)\)\s*/i, '')
    .replace(/\s*\((?:Spring|Summer|CIEE|Group [A-Z0-9]+)\)\s*/gi, '')
    .replace(/\s*-\s*Summer\s*2027.*$/i, '')
    .replace(/\s*\(Summer\s*2027.*?\)/i, '')
    .replace(/\s+กับ\s+New\s+Step.*$/i, '')
    .replace(/^.*?ที่\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveArea(city?: string, state?: string): string | undefined {
  if (!city && !state) return undefined;
  const c = (city || '').toLowerCase();
  const s = (state || '').toLowerCase();

  if (c.includes('denali') || c.includes('healy') || c.includes('cantwell')) return 'Denali Area';
  if (c.includes('sandusky')) return 'Sandusky / Lake Erie';
  if (c.includes('dells')) return 'Wisconsin Dells';
  if (c.includes('glacier') || c.includes('apgar') || c.includes('st. mary') || c.includes('columbia falls')) return 'Glacier National Park Area';
  if (c.includes('yellowstone') || c.includes('gardiner')) return 'Yellowstone Area';
  if (c.includes('yosemite') || c.includes('el portal') || c.includes('groveland')) return 'Yosemite Area';
  if (c.includes('virginia beach')) return 'Virginia Beach Area';
  if (c.includes('myrtle beach')) return 'Myrtle Beach Area';
  if (c.includes('lake tahoe')) return 'Lake Tahoe Area';
  if (c.includes('grand canyon')) return 'Grand Canyon Area';
  if (c.includes('williamsburg')) return 'Williamsburg Area';
  if (c.includes('panama city beach')) return 'Panama City Beach Area';
  if (c.includes('gulf shores') || c.includes('orange beach')) return 'Gulf Shores Coast';
  if (c.includes('hilton head')) return 'Hilton Head Island';
  return undefined;
}

export function canonicalEmployer(rawName: string, city?: string, state?: string): CanonicalInfo {
  const cleaned = cleanEmployerName(rawName);
  const normalizedKey = cleaned.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

  let canonicalName = cleaned;
  let area = resolveArea(city, state);

  if (ALIAS_MAP[normalizedKey]) {
    canonicalName = ALIAS_MAP[normalizedKey].canonical;
    if (ALIAS_MAP[normalizedKey].area) area = ALIAS_MAP[normalizedKey].area;
  }

  const id = slug(`${canonicalName}-${city || ''}-${state || ''}`);

  return {
    id,
    canonicalName,
    area,
    city: city?.trim(),
    state: state?.trim()
  };
}

export function categorizePosition(name: string): JobCategory {
  const n = name.toLowerCase();

  if (/(prep cook|line cook|cook|kitchen|dish steward|dishwasher|dish|baker|food prep|steward|culinary|boh)/i.test(n)) {
    return 'KITCHEN_BOH';
  }
  if (/(busser|server|waiter|waitress|host|hostess|food & beverage|f&b|barista|counter|dining|concession)/i.test(n)) {
    return 'FOOD_FOH';
  }
  if (/(housekeep|room attendant|laundry|public area|custodian|janitor|cleaner|houseperson|linen)/i.test(n)) {
    return 'HOUSEKEEPING';
  }
  if (/(lifeguard|ride operator|attraction|game operator|park service|area host|recreation|waterpark|pool)/i.test(n)) {
    return 'ATTRACTION';
  }
  if (/(cashier|retail|merchandise|sales|store|gift shop|clerk)/i.test(n)) {
    return 'RETAIL';
  }
  return 'OTHER';
}

import type { Job, JobCategory } from './types';
import { clamp } from './common';

const NATURE_STATES: Record<string,number> = {
  alaska:10, montana:9.5, wyoming:10, utah:9, colorado:9, maine:8, vermont:8,
  washington:9, oregon:8.5, california:7.5, nevada:6.5, tennessee:8, florida:7, hawaii:10
};
const NATURE_TOWNS: Record<string,number> = {
  denali:10, healy:9.5, seward:10, girdwood:10, whittier:10, 'copper center':10, 'trapper creek':10,
  'west glacier':10, 'east glacier':10, 'st. mary':10, 'lake mcdonald':10, jackson:10, moran:10, moose:10,
  yellowstone:10, mammoth:10, 'south lake tahoe':9.5, 'north lake tahoe':9.5, stateline:9,
  gatlinburg:9, 'big sky':9.5, 'bryce canyon':10, yosemite:10, destin:8
};
const JOB2_TOWNS: Record<string,number> = {
  seward:7.5, girdwood:6.5, denali:6.5, healy:7, anchorage:10, fairbanks:9,
  'south lake tahoe':10, 'north lake tahoe':9.5, stateline:10, jackson:9, gatlinburg:9,
  destin:9.5, 'west glacier':6.5, 'east glacier':4.5, 'st. mary':4.5, yellowstone:3,
  mammoth:3, 'big sky':7.5, 'bryce canyon':4
};
const EMPLOYER_HINTS: Array<[RegExp,number,number]> = [
  [/HAP|Holland America|Princess Wilderness/i,8.2,8.8],
  [/Grand Teton Lodge/i,8.2,8.5],
  [/Pursuit/i,7.8,8.3],
  [/Xanterra/i,6.5,8.2],
  [/Margaritaville/i,7.4,8],
  [/Fudpucker/i,8,8],
  [/Starbucks/i,7.4,8],
  [/Harbor 360/i,7.2,7.5]
];

export function categoryFrom(position=''): JobCategory {
  if (/(dish|prep|cook|kitchen|culinary|food production|food prep|pantry|employee dining|utility|steward)/i.test(position)) return 'FOOD_BOH';
  if (/(server|busser|host|barista|cashier|food service|runner)/i.test(position)) return 'FOOD_FOH';
  if (/(housekeep|room attendant|laundry|public area)/i.test(position)) return 'HOUSEKEEPING';
  if (/(retail|sales|store|stock)/i.test(position)) return 'RETAIL';
  if (/(ride|lifeguard|water slide|attraction)/i.test(position)) return 'ATTRACTION';
  return 'OTHER';
}

export function englishFrom(position=''){
  if (/(dish|steward|utility|laundry|room attendant|housekeep)/i.test(position)) return 'A2–B1';
  if (/(prep|kitchen|cook|food production|employee dining)/i.test(position)) return 'B1';
  if (/(server|host|barista|cashier|front desk|retail)/i.test(position)) return 'B1–B2';
  return 'A2–B1';
}

function byLocation(job:Job, table:Record<string,number>, fallback:number){
  const hay=[job.city,job.locationText,job.employer].filter(Boolean).join(' ').toLowerCase();
  for (const [k,v] of Object.entries(table)) if (hay.includes(k)) return v;
  return fallback;
}
function stateScore(job:Job){ return NATURE_STATES[(job.state||'').toLowerCase()] ?? 5.5; }

function inferLocation(job:Job){
  const hay=[job.employer,job.locationText,job.rawText].filter(Boolean).join(' ').toLowerCase();
  const known:Array<[RegExp,string,string?]>=[
    [/denali princess wilderness lodge/i,'Alaska','Denali'],
    [/holland america denali lodge|mckinley chalet/i,'Alaska','Denali'],
    [/mt\.? mckinley princess/i,'Alaska','Trapper Creek'],
    [/copper river princess/i,'Alaska','Copper Center'],
    [/denali park village/i,'Alaska','Denali'],
    [/healy homestead/i,'Alaska','Healy'],
    [/glacier park lodge/i,'Montana','East Glacier Park'],
    [/st\.? mary village/i,'Montana','St. Mary'],
    [/xanterra.*glacier|glacier park lodges/i,'Montana','Glacier National Park'],
    [/grand teton lodge/i,'Wyoming','Moran/Moose/Jackson'],
    [/yellowstone/i,'Wyoming','Yellowstone National Park'],
    [/lake tahoe|stateline/i,'Nevada','Stateline'],
    [/seward/i,'Alaska','Seward'],
    [/girdwood/i,'Alaska','Girdwood']
  ];
  for(const [r,state,city] of known) if(r.test(hay)){job.state ||= state; job.city ||= city; break;}
  if(!job.state){ for(const st of Object.keys(NATURE_STATES)){ if(hay.includes(st)){job.state=st.replace(/\b\w/g,c=>c.toUpperCase()); break;} } }
}

export function enrichForProfile(input:Job): Job {
  const job={...input};
  inferLocation(job);
  job.category ||= categoryFrom(job.position);
  job.englishFit ||= englishFrom(job.position);
  job.natureFit ??= byLocation(job,NATURE_TOWNS,stateScore(job));
  job.secondJobFit ??= byLocation(job,JOB2_TOWNS,6);
  const hint=EMPLOYER_HINTS.find(([r])=>r.test(job.employer));
  job.employerFit ??= hint?.[1] ?? 7;
  job.socialFit ??= hint?.[2] ?? (/(lodge|resort|national park|seasonal)/i.test(job.employer+' '+(job.rawText||'')) ? 8 : 6.5);
  job.group3Fit ??= job.availableSlots == null ? 6.5 : job.availableSlots >= 3 ? 10 : job.availableSlots > 0 ? 3.5 : 0;

  const wage=job.wageMax ?? job.wageMin ?? 15;
  const housing=job.housingWeekly ?? 160;
  let effective=wage - housing/40;
  if (job.mealsIncluded) effective += 1.5;
  job.valueFit ??= clamp((effective-9)/1.05,3,10);
  const employerSocial=((job.employerFit||7)+(job.socialFit||7))/2;
  job.fitScore=Math.round((employerSocial*.30 + (job.natureFit||5)*.25 + (job.valueFit||5)*.20 + (job.secondJobFit||5)*.15 + (job.group3Fit||5)*.10)*10)/10;
  return job;
}

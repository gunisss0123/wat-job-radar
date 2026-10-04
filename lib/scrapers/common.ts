import * as cheerio from 'cheerio';
import type { Job, JobStatus } from '../types';
import { slug, uniq } from '../common';

const UA='Mozilla/5.0 (compatible; WAT-Job-Radar/1.0; +personal-research)';
export async function getHtml(url:string, timeoutMs=18000){
  const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
  try{
    const res=await fetch(url,{headers:{'user-agent':UA,'accept-language':'th,en-US;q=0.9,en;q=0.8'},cache:'no-store',signal:ctrl.signal,redirect:'follow'});
    if(!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.text();
  } finally { clearTimeout(timer); }
}
export const textOf=(html:string)=>cheerio.load(html)('body').text().replace(/\s+/g,' ').trim();
export const absolute=(base:string,href:string)=>new URL(href,base).toString();
export {uniq};
export function statusFrom(slots:number|null|undefined, body=''):JobStatus{
  if(slots===0 || /\bเต็ม\b|sold\s*out|available\s*:\s*0/i.test(body)) return 'FULL';
  if(slots!=null && slots>0 && slots<3) return 'LIMITED';
  if(slots!=null && slots>=3) return 'OPEN';
  if(/pending|coming soon|รอยืนยัน|ยังไม่เปิด|ทยอย/i.test(body)) return 'PENDING';
  if(/เปิดรับสมัคร|apply now|available/i.test(body)) return 'UNKNOWN';
  return 'UNKNOWN';
}
export function baseJob(p:Partial<Job>&Pick<Job,'agency'|'employer'|'sourceUrl'>):Job{
  const id=p.id || `${slug(p.agency)}-${slug(p.employer)}-${slug(p.position||p.city||'listing')}`;
  return {id,season:'Summer 2027',status:'UNKNOWN',lastSeenAt:new Date().toISOString(),...p};
}
export function numberAfter(label:string,body:string){
  const re=new RegExp(label+'\\s*[:：-]?\\s*\\$?([\\d.]+)','i'); const m=body.match(re); return m?Number(m[1]):undefined;
}
export function housingWeekly(text?:string){
  if(!text) return undefined; const m=text.replace(/,/g,'').match(/\$\s*(\d+(?:\.\d+)?)\s*(?:\/|per\s*)?(week|wk|day|month)/i); if(!m)return undefined;
  const n=Number(m[1]); const unit=m[2].toLowerCase(); return unit==='day'?n*7:unit==='month'?n*12/52:n;
}
export function stateFromCode(s?:string){
 const codes:Record<string,string>={AK:'Alaska',MT:'Montana',WY:'Wyoming',CA:'California',NV:'Nevada',TN:'Tennessee',FL:'Florida',UT:'Utah',WA:'Washington',OR:'Oregon',ME:'Maine',NH:'New Hampshire',PA:'Pennsylvania',NJ:'New Jersey',HI:'Hawaii',CO:'Colorado',CT:'Connecticut'};
 if(!s)return undefined; return codes[s.toUpperCase()]||s;
}

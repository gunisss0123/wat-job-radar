import * as cheerio from 'cheerio';
import type { Job } from '../types';
import { absolute, baseJob, getHtml, housingWeekly, statusFrom, textOf, uniq } from './common';
import { slug } from '../common';
const LIST='https://www.acadexthailand.com/program/work-and-travel-summer/';
export async function scrapeAcadex(limit=220):Promise<Job[]>{
 const html=await getHtml(LIST); const $=cheerio.load(html);
 const links=uniq($('a[href*="/location/"]').map((_,a)=>absolute(LIST,$(a).attr('href')||'')).get()).filter(Boolean).slice(0,limit);
 const out:Job[]=[];
 for(const url of links){
  try{
   const h=await getHtml(url); const $$=cheerio.load(h); const body=textOf(h); if(!/Summer 2027/i.test(body)) continue;
   const h1=$$('h1').first().text().replace(/\s+/g,' ').trim(); const employer=(h1||url.split('/').filter(Boolean).pop()||'ACADEX Job').replace(/\s*\(Summer 2027.*$/i,'').trim();
   const location=(body.match(/(?:Image)?\s*([A-Za-z .'/()-]+),\s*([A-Za-z ]+)\s+#/i));
   const stateBlock=(body.match(/State\s*([^]{1,90}?)(?=Detail|Job Description|iframe)/i)||[])[1]?.trim();
   const wage=body.match(/Rate\s*\$?([\d.]+)(?:\s*[-–]\s*\$?([\d.]+))?\s*per hour/i);
   const hours=body.match(/Hours\s*(Average\s*[\d.]+\s*[-–]\s*[\d.]+\s*hours per week)/i);
   const housingText=(body.match(/Housing\s*([^]{1,220}?)(?=Housing Deposit Required|Transportation to work)/i)||[])[1]?.trim();
   const startText=(body.match(/Start Date\s*([^]{1,90}?)(?=End Date)/i)||[])[1]?.trim(); const endText=(body.match(/End Date\s*([^]{1,90}?)(?=Remark|Housing|\*)/i)||[])[1]?.trim();
   let slots:null|number=null; const avail=(body.match(/Available\s*(\d+)/i)||[])[1]; if(avail) slots=Number(avail); else if(/\bเต็ม\b/.test(body)) slots=0;
   const posSection=(body.match(/Position\s*([^]{1,900}?)(?=Rate\s*\$|Rate\s|Hours\s)/i)||[])[1]||'';
   const positions=[...posSection.matchAll(/-\s*([^\n*-][^\n]{1,100})/g)].map(m=>m[1].trim()).filter(x=>x && !/ตำแหน่งงาน|นายจ้าง|งานนี้นัด/i.test(x));
   const common={agency:'ACADEX',employer,city:location?.[1]?.trim(),state:(stateBlock||location?.[2])?.replace(/\s+/g,' ').trim(),wageMin:wage?Number(wage[1]):undefined,wageMax:wage?Number(wage[2]||wage[1]):undefined,wageText:wage?`$${wage[1]}${wage[2]?`–${wage[2]}`:''}/hr`:undefined,housingText,housingWeekly:housingWeekly(housingText),mealsIncluded:/meal|3 meals|อาหาร/i.test(housingText||body),mealsText:/meal|อาหาร/i.test(housingText||'')?'มี meal plan/ดูรายละเอียดต้นทาง':undefined,hoursText:hours?.[1],availableSlots:slots,availabilityText:slots==null?undefined:`Available: ${slots}`,status:statusFrom(slots,body),startText,endText,sourceUrl:url,rawText:body.slice(0,9000)};
   if(positions.length){ for(const p of positions) out.push(baseJob({...common,id:`acadex-${slug(employer)}-${slug(p)}`,position:p})); }
   else out.push(baseJob({...common,id:`acadex-${slug(employer)}`}));
  }catch{}
 }
 return out;
}

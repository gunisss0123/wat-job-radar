import type {JobEvent,Job} from './types';
export async function telegram(text:string){const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;if(!token||!chat)return false;const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chat,text,disable_web_page_preview:true})});return r.ok;}
export function alertable(job:Job){return job.status==='OPEN' && (job.availableSlots==null||job.availableSlots>=3) && (job.fitScore||0)>=7.5;}

export function moneyFromText(s?: string | null): number | undefined {
  if (!s) return undefined;
  const m=s.replace(/,/g,'').match(/\$?\s*(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : undefined;
}
export function clamp(n:number,min=0,max=10){ return Math.min(max,Math.max(min,n)); }
export function slug(s:string){ return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100) || 'job'; }
export function uniq<T>(xs:T[]){ return [...new Set(xs)]; }
export function sameish(a?:string,b?:string){ return (a||'').trim().toLowerCase()===(b||'').trim().toLowerCase(); }

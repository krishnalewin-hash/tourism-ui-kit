const ALLOW = ["pickup_location","dropoff_location","pickup_date","pickup_time","passengers","first_name","last_name","email","phone"];
export function readParams(){
  const qs = new URLSearchParams(location.search); const o = {};
  ALLOW.forEach(k => { const v = qs.get(k); if (v && v.trim()) o[k]=v; });
  return o;
}
export function hasRequired(o){
  return !!(String(o.pickup_location||"").trim() && String(o.dropoff_location||"").trim());
}
export function buildUrl(base, params){
  const u=new URL(base, location.origin);
  const p=new URLSearchParams(u.search);
  Object.entries(params||{}).forEach(([k,v])=>{ if(ALLOW.includes(k) && v && String(v).trim()) p.set(k,v); });
  u.search=p.toString(); return u.toString();
}
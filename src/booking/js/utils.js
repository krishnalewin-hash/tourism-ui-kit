export const PARAM_ALLOWLIST = [
  'pickup_location','dropoff_location','pickup_date','pickup_time','number_of_passengers',
  'first_name','last_name','email','phone'
];

export function cacheIncomingParams(qs){
  PARAM_ALLOWLIST.forEach(k=>{
    if (qs.has(k)) { try { sessionStorage.setItem('lead:'+k, qs.get(k)||''); } catch {} }
  });
}

export function getParam(qs, name){
  const v = qs.get(name);
  if (v && String(v).trim()) return v;
  try { return sessionStorage.getItem('lead:'+name) || ''; } catch { return ''; }
}
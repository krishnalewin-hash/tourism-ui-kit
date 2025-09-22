// Global namespace for booking form
window.BookingForm = window.BookingForm || {};

window.BookingForm.PARAM_ALLOWLIST = [
  'pickup_location','dropoff_location','pickup_date','pickup_time','number_of_passengers',
  'first_name','last_name','email','phone'
];

window.BookingForm.cacheIncomingParams = function(qs){
  window.BookingForm.PARAM_ALLOWLIST.forEach(k=>{
    if (qs.has(k)) { try { sessionStorage.setItem('lead:'+k, qs.get(k)||''); } catch {} }
  });
};

window.BookingForm.getParam = function(qs, name){
  const v = qs.get(name);
  if (v && String(v).trim()) return v;
  try { return sessionStorage.getItem('lead:'+name) || ''; } catch { return ''; }
};
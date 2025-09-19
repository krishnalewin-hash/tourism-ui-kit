export function classifyRegion(pickup, dropoff){
  const t = s => (s||"").toLowerCase();
  const a=t(pickup), b=t(dropoff), hay=a+" "+b;
  const isAirport    = /(sangster|montego bay intl|montego bay international|mbj|airport)/.test(hay);
  const inMBJ        = /(montego\s*bay|ironshore|rose hall|hip strip|gloucester ave)/.test(hay);
  const inOchi       = /(ocho\s*rios|st\.?\s*ann|st ann)/.test(hay);
  const inNegril     = /(negril|westmoreland|seven mile|bloody bay)/.test(hay);
  if ((isAirport && inMBJ)    || (inMBJ && isAirport))    return "MBJ_AREA";
  if ((isAirport && inOchi)   || (inOchi && isAirport))   return "OCHO_RIOS";
  if ((isAirport && inNegril) || (inNegril && isAirport)) return "NEGRIL";
  return null;
}
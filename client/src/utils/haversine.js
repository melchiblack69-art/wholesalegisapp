// Returns distance in km between two lat/lng points.
// Keep full precision here because callers use this for GPS thresholds.
// Format the value only when displaying it to users.
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const a1 = parseFloat(lat1), o1 = parseFloat(lon1);
  const a2 = parseFloat(lat2), o2 = parseFloat(lon2);
  if ([a1, o1, a2, o2].some(v => isNaN(v))) return null;

  const R = 6371; // km
  const dLat = (a2 - a1) * Math.PI / 180;
  const dLon = (o2 - o1) * Math.PI / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a1 * Math.PI / 180) * Math.cos(a2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const d = R * 2 * Math.asin(Math.sqrt(x));
  return d;
}

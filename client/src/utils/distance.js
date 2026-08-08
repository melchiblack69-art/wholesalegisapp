export function formatDistance(distanceKm) {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) return "—";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${Number(distanceKm).toFixed(1)} km`;
}

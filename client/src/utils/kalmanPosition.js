// Lightweight 2D Kalman filter for smoothing noisy browser GPS readings.
export function createKalmanPosition() {
  let latitude = null;
  let longitude = null;
  let variance = -1;

  return {
    reset() {
      latitude = null;
      longitude = null;
      variance = -1;
    },
    update(nextLatitude, nextLongitude, accuracy = 25) {
      const measurementVariance = Math.max(accuracy * accuracy, 4);
      if (variance < 0 || latitude == null || longitude == null) {
        latitude = nextLatitude;
        longitude = nextLongitude;
        variance = measurementVariance;
        return { lat: latitude, lng: longitude };
      }

      // Add process noise so the estimate remains responsive to real movement.
      // Without this, variance converges to zero and the marker can appear frozen.
      variance += 9;
      const gain = variance / (variance + measurementVariance);
      latitude += gain * (nextLatitude - latitude);
      longitude += gain * (nextLongitude - longitude);
      variance = (1 - gain) * variance;
      return { lat: latitude, lng: longitude };
    },
  };
}

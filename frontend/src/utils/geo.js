export const toRadians = (deg) => (deg * Math.PI) / 180;
export const toDegrees = (rad) => (rad * 180) / Math.PI;

export function computeBearing(lat1, lon1, lat2, lon2) {
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δλ = toRadians(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return (toDegrees(θ) + 360) % 360;
}

export function estimateNewPosition({ lat, lon, heading, speed, timeElapsed }) {
    const R = 6371000; // Earth radius in meters
    const δ = (speed * timeElapsed) / R;
    const θ = toRadians(heading);

    const φ1 = toRadians(lat);
    const λ1 = toRadians(lon);

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 =
        λ1 +
        Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

    return { lat: toDegrees(φ2), lon: toDegrees(λ2) };
}

import type { VehicleSnapshot } from "../domain"

// Explicitly marked demo data. Never used as a connected-account fallback.
export function atelierDemo(now = new Date()): VehicleSnapshot {
  const time = now.toISOString()
  return {
    schemaVersion: 1, localVehicleId: "atelier-demo", identity: { displayName: "My BMW", brand: "BMW", model: "Demo vehicle" },
    energy: { type: "fuel", rangeKm: 400, levelPercent: 60, fuelPercent: 60 }, mileageKm: 12000,
    access: { lock: "locked", doors: "closed", windows: "closed", roof: "closed", hood: "closed", trunk: "closed" },
    checks: [], vehicleObservedAt: time, fetchedAt: time, cachedAt: time, source: "fixture",
  }
}

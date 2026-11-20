import type { VehicleSnapshot } from "./domain"

export function makeDemoSnapshot(now = new Date()): VehicleSnapshot {
  const observedAt = new Date(now.getTime() - 6 * 60 * 1000)
  return {
    schemaVersion: 1,
    localVehicleId: "demo-bmw-i4",
    identity: {
      displayName: "Demo vehicle",
      brand: "BMW",
      model: "Demo vehicle",
    },
    energy: {
      type: "electric",
      levelPercent: 78,
      rangeKm: 416,
      consumption: 15.8,
      consumptionUnit: "kWh/100km",
    },
    mileageKm: 12846,
    access: {
      lock: "locked",
      doors: "closed",
      windows: "closed",
      roof: "closed",
      hood: "closed",
      trunk: "closed",
      doorStates: {
        leftFront: "closed",
        leftRear: "closed",
        rightFront: "closed",
        rightRear: "closed",
      },
      windowStates: {
        leftFront: "closed",
        leftRear: "closed",
        rightFront: "closed",
        rightRear: "closed",
      },
    },
    tires: {
      frontLeft: { pressureBar: 2.5, targetBar: 2.5, status: "normal" },
      frontRight: { pressureBar: 2.5, targetBar: 2.5, status: "normal" },
      rearLeft: { pressureBar: 2.7, targetBar: 2.7, status: "normal" },
      rearRight: { pressureBar: 2.6, targetBar: 2.7, status: "warning" },
    },
    charging: {
      state: "disconnected",
    },
    checks: [
      {
        id: "rear-right-tire",
        severity: "warning",
        title: "右后轮胎压略低",
        detail: "当前 2.6 bar，建议值 2.7 bar",
      },
    ],
    vehicleObservedAt: observedAt.toISOString(),
    fetchedAt: now.toISOString(),
    cachedAt: now.toISOString(),
    source: "fixture",
  }
}

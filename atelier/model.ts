import type { CompanionSettings, VehicleSnapshot } from "../domain"

// Shared by both native renderers and the local review surface.
export const PALETTE = {
  background: { light: "#F7F7F5", dark: "#262729" },
  text: { light: "#202124", dark: "#F3F3F1" },
  secondary: { light: "#717379", dark: "#B0B2B7" },
  quiet: { light: "#85878D", dark: "#A0A2A8" },
  chip: { light: "#EAEAE7", dark: "#363739" },
  warning: { light: "#9C570E", dark: "#EDB86C" },
  critical: { light: "#B23F35", dark: "#FFAAA0" },
} as const

export type Appearance = "system" | "light" | "dark"
export type Tone = "secondary" | "warning" | "critical"
export const DEFAULT_TITLE = "My BMW"

export function cleanText(value: unknown, max = 80): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : ""
}

function number(value: unknown, decimals = 0): string {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value.toLocaleString("en-US", { maximumFractionDigits: decimals }) : "—"
}

function percent(value?: number): string {
  return value != null && Number.isFinite(value) && value >= 0 && value <= 100 ? `${Math.round(value)}%` : "—"
}

export function syncLabel(iso?: string, now = new Date()): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return "Time unavailable"
  const date = new Date(iso)
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  if (date.toDateString() === now.toDateString()) return time
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${time}`
}

export function appearanceOf(settings: Partial<CompanionSettings>): Appearance {
  if (["system", "light", "dark"].includes(settings.widgetAppearance ?? "")) return settings.widgetAppearance!
  return settings.alwaysDarkBackground ? "dark" : "system"
}

function accessSummary(snapshot: VehicleSnapshot): { label: string; tone: Tone } {
  const a = snapshot.access
  const states = [a.doors, a.windows, a.roof, a.hood, a.trunk]
  if (states.includes("open")) return { label: "Check doors & windows", tone: "warning" }
  const details = [...Object.values(a.doorStates ?? {}), ...Object.values(a.windowStates ?? {})]
  if (details.includes("open")) return { label: "Check doors & windows", tone: "warning" }
  if (a.doors !== "closed" || a.windows !== "closed") return { label: "Status unavailable", tone: "secondary" }
  return { label: "Doors & windows closed", tone: "secondary" }
}

export function widgetModel(snapshot: VehicleSnapshot, settings: Partial<CompanionSettings>, options: {
  offline?: boolean; needsLogin?: boolean; now?: Date; unavailable?: boolean
} = {}) {
  const now = options.now ?? new Date()
  const observed = snapshot.vehicleObservedAt
  const age = observed ? now.getTime() - Date.parse(observed) : NaN
  const stale = Number.isFinite(age) && age > (settings.staleHours ?? 6) * 3_600_000
  const demo = snapshot.source === "fixture" && !options.unavailable
  const energy = snapshot.energy
  const fuel = energy.type === "fuel" ? energy.fuelPercent ?? energy.levelPercent : energy.batteryPercent ?? energy.levelPercent
  const access = accessSummary(snapshot)
  const issue = snapshot.checks.find(item => item.severity === "critical") ?? snapshot.checks.find(item => item.severity === "warning")
  const locked = snapshot.access.lock === "locked"
  const lock = snapshot.driving ? "Driving" : locked ? "Locked" : snapshot.access.lock === "unlocked" ? "Unlocked" : "Lock unknown"
  const tone: Tone = snapshot.access.lock === "unlocked" && !snapshot.driving ? "warning" : "secondary"
  let status = access.label
  let statusTone = access.tone
  if (issue) {
    status = `${snapshot.checks.filter(item => item.severity !== "info").length} vehicle ${snapshot.checks.filter(item => item.severity !== "info").length === 1 ? "alert" : "alerts"}`
    statusTone = issue.severity === "critical" ? "critical" : "warning"
  }
  const notice = options.unavailable ? "SET UP" : options.needsLogin ? "SIGN IN" : options.offline ? "OFFLINE" : demo ? "DEMO" : stale ? "LAST SYNC" : ""
  return {
    title: cleanText(settings.widgetTitle) || DEFAULT_TITLE,
    range: options.unavailable ? "—" : number(energy.rangeKm),
    energy: options.unavailable ? "—" : percent(fuel),
    energyIcon: energy.type === "electric" ? "bolt" : "fuelpump",
    odometer: `${number(snapshot.mileageKm)} km total`,
    lock, lockIcon: snapshot.driving ? "car.side" : locked ? "lock" : "lock.open", lockTone: tone,
    sync: syncLabel(observed, now),
    status: options.unavailable ? "Connect in the app" : status,
    statusTone, notice,
    reserve: cleanText(settings.widgetReservedText),
    appearance: appearanceOf(settings),
  }
}

export function emptySnapshot(): VehicleSnapshot {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1, localVehicleId: "not-connected", identity: { displayName: DEFAULT_TITLE, brand: "BMW" },
    energy: { type: "fuel" }, access: { lock: "unknown", doors: "unknown", windows: "unknown", roof: "unknown", hood: "unknown", trunk: "unknown" },
    checks: [], cachedAt: now, fetchedAt: now, source: "legacy",
  }
}

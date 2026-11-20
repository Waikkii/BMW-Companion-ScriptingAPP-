// Keep intrinsic columns within the smallest supported medium widget, even if
// display zoom makes the real widget narrower than the screen-size estimate.
export const MEDIUM_LAYOUT = {
  top: 14, horizontal: 16, bottom: 14,
  header: 24, headerGap: 6, body: 78, footer: 11,
  metricsWidth: 128, range: 40, odometerGap: 2, odometer: 12, chipGap: 6, chip: 18,
  carWidth: 148, carHeight: 76, unitBaselineInset: 5,
} as const

export const SMALL_LAYOUT = {
  top: 12, horizontal: 14, bottom: 12,
  header: 18, headerGap: 5, range: 32, footer: 10,
  carWidth: 120, carHeight: 56, unitBaselineInset: 3,
} as const

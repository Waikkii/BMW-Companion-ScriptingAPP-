// Subtle ambient light across the surface. Every stop stays dynamic so a
// system appearance change does not require baking or downloading an image.
export const SURFACE_STOPS = [
  { location: 0, light: "#FCFCFA", dark: "#2D2E31" },
  { location: 0.55, light: "#F7F7F5", dark: "#28292C" },
  { location: 1, light: "#F1F2F0", dark: "#232426" },
] as const

export const SURFACE_DIRECTION = {
  start: { x: 0, y: 0 },
  end: { x: 0.65, y: 1 },
} as const

// Native Apple system font APIs choose San Francisco's appropriate optical
// size. No external font files, private font names or network requests.
export const TYPOGRAPHY = {
  title: { small: 14.5, medium: 19, weight: "semibold" },
  range: { small: 27, medium: 34, weight: "light" },
} as const

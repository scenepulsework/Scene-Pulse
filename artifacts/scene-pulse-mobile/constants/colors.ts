/**
 * ScenePulse dark neon palette — synced from the sibling web artifact
 * (artifacts/scene-pulse/src/index.css). The web app is dark-only, so both
 * schemes use the same tokens.
 */

const scenePulse = {
  // Legacy aliases
  text: '#fafafa',
  tint: '#00d5ff',

  // Core surfaces
  background: '#0a0a0b',
  foreground: '#fafafa',

  // Cards / elevated surfaces
  card: '#0e0e11',
  cardForeground: '#fafafa',

  // Primary: neon cyan
  primary: '#00d5ff',
  primaryForeground: '#0a0a0b',

  // Secondary: electric magenta
  secondary: '#ff33bb',
  secondaryForeground: '#ffffff',

  // Muted
  muted: '#24242c',
  mutedForeground: '#a1a1ac',

  // Accent: bright yellow
  accent: '#ffdd1a',
  accentForeground: '#0a0a0b',

  // Destructive
  destructive: '#ee4444',
  destructiveForeground: '#fafafa',

  // Extra semantic tones for crowd levels
  success: '#22c55e',

  // Borders and inputs
  border: '#24242c',
  input: '#24242c',
};

const colors = {
  light: scenePulse,
  dark: scenePulse,

  // Synced from the web artifact's --radius (0.85rem)
  radius: 14,
};

export default colors;

/**
 * Design tokens and constants for the application
 */

export const ANIMATION_DURATIONS = {
  TOAST_FADE: 1200,
  BADGE_BOUNCE: 600,
  DRAWER_SLIDE: 300,
  SKELETON_DELAY: 300,
} as const;

export const Z_INDEX = {
  DRAWER_OVERLAY: 40,
  DRAWER: 50,
  MODAL_OVERLAY: 90,
  MODAL: 100,
  ALERT_DIALOG: 200,
  TOAST: 9999,
} as const;

export const BRAND_COLORS = {
  PRIMARY: '#9955E8',
  PRIMARY_HOVER: '#8040D4',
  ACCENT: '#7BFFAF',
  ACCENT_DARK: '#1A7A4A',
  DARK_BG: '#0F0B1A',
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;

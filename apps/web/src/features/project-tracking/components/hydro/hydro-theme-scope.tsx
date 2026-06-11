/**
 * Theme scope for the Dashboard area.
 *
 * The Hydro brand theme is now applied globally (see main.tsx), so this
 * component is a passthrough kept for compatibility — any future per-route
 * theme overrides can be wired here without touching every page.
 */
export function HydroThemeScope({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

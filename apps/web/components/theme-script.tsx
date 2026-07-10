/**
 * Inline script component to prevent Flash of Unstyled Content (FOUC).
 * The HomeOS palette is light-only for now — no dark values designed yet —
 * so this forces light regardless of stored preference. Restore the
 * localStorage/matchMedia logic once the .dark token block is re-tinted.
 */
export function ThemeScript() {
  return (
    <script
      // Static hardcoded script — no user input, no XSS risk
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.classList.remove("dark")`,
      }}
    />
  );
}

/**
 * Inline script component to prevent Flash of Unstyled Content (FOUC).
 * Reads the theme from localStorage before the first paint and applies
 * the .dark class to html if needed. This is a hardcoded, static script
 * with no user-controlled input — safe to render inline.
 */
export function ThemeScript() {
  return (
    <script
      // Static hardcoded script — no user input, no XSS risk
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("homeos-theme");var d=(!t||t==="system")?window.matchMedia("(prefers-color-scheme: dark)").matches:t==="dark";if(d)document.documentElement.classList.add("dark")}catch(e){}})()`,
      }}
    />
  );
}

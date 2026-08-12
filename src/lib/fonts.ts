import localFont from "next/font/local";

/**
 * Poppins is self-hosted (files live in `src/app/fonts`) rather than pulled from
 * Google at build time. next/font/google needs to fetch over the network while
 * building, which is exactly what used to break the Turbopack build; bundling
 * the woff2 files means the build — locally and on Vercel — never makes a
 * network request, and the font is served from our own origin at runtime.
 *
 * Exposed as the `--font-poppins` CSS variable so a single source of truth
 * drives Tailwind utilities, plain CSS, and the Ant Design theme token alike.
 */
export const poppins = localFont({
  src: [
    { path: "../app/fonts/Poppins-400.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/Poppins-500.woff2", weight: "500", style: "normal" },
    { path: "../app/fonts/Poppins-600.woff2", weight: "600", style: "normal" },
    { path: "../app/fonts/Poppins-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

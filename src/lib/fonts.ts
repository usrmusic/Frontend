// Avoid using next/font/google during build to prevent Turbopack from
// attempting to fetch Google fonts at build time (can fail in some envs).
// Provide small fallback objects with the `variable` property so existing
// usages in `layout.tsx` continue to work without the runtime font loader.
export const raleway = { variable: "" };
export const poppins = { variable: "" };

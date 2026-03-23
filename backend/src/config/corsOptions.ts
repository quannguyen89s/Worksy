import type { CorsOptions } from "cors";

/** Empty / unset CORS_ORIGIN → allow any origin (dev). Comma-separated list in production. */
export function getCorsOptions(): CorsOptions {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return { origin: true, credentials: true };
  }
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (list.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  };
}

import type { Request } from "express";

/** Normalize Express route param to a single string. */
export function paramId(req: Request, key = "id"): string {
  const v = req.params[key];
  if (Array.isArray(v)) return v[0] ?? "";
  if (typeof v === "string") return v;
  return "";
}

/// <reference types="multer" />

import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      /** Set by JWT auth middleware */
      user?: { id: string; role: string; name: string } | string | JwtPayload;
      /** Set by multer `.single()` / `.array()` */
      file?: Express.Multer.File;
    }
  }
}

export {};

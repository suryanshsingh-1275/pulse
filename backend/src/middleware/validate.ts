import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export const validate =
  (schema: ZodTypeAny, source: "body" | "query" = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[source]);
    if (source === "body") req.body = parsed;
    else (req as any).validatedQuery = parsed;
    next();
  };
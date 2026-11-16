import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Route not found" } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { message: err.message, code: err.code } });
  }
  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
}
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import * as service from "./application.service";

export const createSchema = z.object({
  name: z.string().min(2).max(60),
  environment: z.enum(["development", "staging", "production"]).default("development"),
});

export const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  enabled: z.boolean().optional(),
  environment: z.enum(["development", "staging", "production"]).optional(),
});

export const list = asyncHandler(async (req, res) => {
  res.json({ data: await service.list(req.userId!) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await service.create(req.userId!, req.body) });
});

export const get = asyncHandler(async (_req, res) => {
  res.json({ data: res.locals.application });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ data: await service.update(res.locals.application, req.body) });
});

export const rotateKey = asyncHandler(async (req, res) => {
  res.json({ data: await service.rotateKey(res.locals.application, req.userId!) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove(res.locals.application, req.userId!);
  res.status(204).end();
});
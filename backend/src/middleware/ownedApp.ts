import { isValidObjectId } from "mongoose";
import { Application } from "../modules/applications/application.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

/** Loads the app only if it belongs to the authenticated user. Everything under /apps/:appId relies on this. */
export const loadOwnedApp = asyncHandler(async (req, res, next) => {
  const id = req.params.appId;
  if (!isValidObjectId(id)) throw new ApiError(404, "Application not found");
  const app = await Application.findOne({ _id: id, userId: req.userId });
  if (!app) throw new ApiError(404, "Application not found");
  res.locals.application = app;
  next();
});
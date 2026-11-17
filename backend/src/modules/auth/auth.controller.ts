import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { User } from "../users/user.model";
import * as service from "./auth.service";

export const register = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await service.register(req.body) });
});


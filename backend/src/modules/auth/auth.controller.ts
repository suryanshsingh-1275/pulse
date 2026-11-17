import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { User } from "../users/user.model";
import * as service from "./auth.service";

export const register = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await service.register(req.body) });
});

export const login = asyncHandler(async (req, res) => {
  res.json({ data: await service.login(req.body) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new ApiError(401, "User no longer exists");
  res.json({ data: user });
});
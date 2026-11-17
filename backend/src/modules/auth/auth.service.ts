import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { User } from "../users/user.model";

const sign = (userId: string) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

export async function register(input: { name: string; email: string; password: string }) {
  if (await User.exists({ email: input.email.toLowerCase() })) {
    throw new ApiError(409, "Email already registered");
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ name: input.name, email: input.email, passwordHash });
  return { user, token: sign(user.id) };
}

export async function login(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  // same error for both cases to avoid user enumeration
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }
  return { user, token: sign(user.id) };
}
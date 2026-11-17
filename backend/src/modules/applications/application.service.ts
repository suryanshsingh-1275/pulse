import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { generateApiKey } from "../../utils/apiKey";
import { AuditLog, audit } from "../audit/auditLog.model";
import { AlertEvent, AlertRule } from "../alerts/alert.model";
import { AppLog } from "../telemetry/appLog.model";
import { ErrorEvent } from "../telemetry/errorEvent.model";
import { ErrorGroup } from "../telemetry/errorGroup.model";
import { RequestMetric } from "../telemetry/requestMetric.model";
import { Application } from "./application.model";

export const list = (userId: string) => Application.find({ userId }).sort({ createdAt: -1 });

export async function create(userId: string, input: { name: string; environment?: string }) {
  const { key, hash, prefix } = generateApiKey();
  try {
    const application = await Application.create({
      userId,
      name: input.name,
      environment: input.environment,
      apiKeyHash: hash,
      apiKeyPrefix: prefix,
    });
    audit(userId, "application.create", { appId: application.id });
    return { application, apiKey: key }; // plaintext key is shown exactly once
  } catch (e: any) {
    if (e.code === 11000) throw new ApiError(409, "You already have an application with that name");
    throw e;
  }
}

export async function update(app: InstanceType<typeof Application>, input: { name?: string; enabled?: boolean; environment?: string }) {
  Object.assign(app, input);
  await app.save();
  return app;
}

export async function rotateKey(app: InstanceType<typeof Application>, userId: string) {
  const { key, hash, prefix } = generateApiKey();
  app.apiKeyHash = hash;
  app.apiKeyPrefix = prefix;
  await app.save();
  audit(userId, "application.rotate_key", { appId: app.id });
  return { application: app, apiKey: key };
}

export async function remove(app: InstanceType<typeof Application>, userId: string) {
  const appId = new Types.ObjectId(app.id);
  await Promise.all([
    RequestMetric.deleteMany({ appId }),
    ErrorEvent.deleteMany({ appId }),
    ErrorGroup.deleteMany({ appId }),
    AppLog.deleteMany({ appId }),
    AlertRule.deleteMany({ appId }),
    AlertEvent.deleteMany({ appId }),
  ]);
  await app.deleteOne();
  audit(userId, "application.delete", { appId: app.id, name: app.name });
}

export { AuditLog };
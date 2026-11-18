import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";
import routes from "./routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: "1mb" }));
if (env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);
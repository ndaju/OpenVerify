import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { initializeSocket } from "./socket";
import authRoutes from "./routes/auth";
import discordRoutes from "./routes/discord";
import vaultRoutes from "./routes/vault";
import channelRoutes from "./routes/channels";
import userRoutes from "./routes/users";

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/discord", discordRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/users", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

initializeSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

export default app;

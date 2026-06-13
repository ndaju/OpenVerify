import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../../../.env");
dotenv.config({ path: envPath });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },

  discord: {
    clientId: required("DISCORD_CLIENT_ID"),
    clientSecret: required("DISCORD_CLIENT_SECRET"),
    redirectUri: required("DISCORD_REDIRECT_URI"),
    botToken: process.env.DISCORD_BOT_TOKEN || "",
  },

  vault: {
    encryptionKey: required("VAULT_ENCRYPTION_KEY"),
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  session: {
    secret: required("SESSION_SECRET"),
  },
} as const;

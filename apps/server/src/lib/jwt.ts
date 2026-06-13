import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return num;
    case "m": return num * 60;
    case "h": return num * 3600;
    case "d": return num * 86400;
    default: return num;
  }
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: parseExpiry(config.jwt.accessExpiry),
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: parseExpiry(config.jwt.refreshExpiry),
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
}

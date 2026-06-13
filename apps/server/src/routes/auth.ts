import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiter";
import { generateToken, hashToken } from "@openverify/crypto";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", authLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      res.status(409).json({ error: "Email or username already taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = generateToken();

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        verificationToken,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user.id,
      verificationToken,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await prisma.auditLog.create({
        data: {
          action: "FAILED_LOGIN",
          userId: user.id,
          ipAddress: req.ip,
        },
      });
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        userAgent: req.headers["user-agent"] || null,
        ipAddress: req.ip || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, sessionId: session.id });

    await prisma.auditLog.create({
      data: {
        action: "LOGIN",
        userId: user.id,
        ipAddress: req.ip,
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: "Session expired" });
      return;
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    const accessToken = signAccessToken({
      userId: session.user.id,
      role: session.user.role,
    });

    const refreshToken = signRefreshToken({
      userId: session.user.id,
      sessionId: session.id,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    res.json({ accessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", authenticate, async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await prisma.session.delete({ where: { id: payload.sessionId } });
      } catch {
        // Token is already invalid, proceed
      }
    }

    await prisma.auditLog.create({
      data: {
        action: "LOGOUT",
        userId: req.user!.userId,
        ipAddress: req.ip,
      },
    });

    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        twoFactorEnabled: true,
        isVerified: true,
        createdAt: true,
        discordAccounts: {
          select: {
            discordId: true,
            discordUsername: true,
            discordAvatar: true,
            guildCount: true,
          },
        },
        vaults: { select: { id: true, name: true, isLocked: true, visibility: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

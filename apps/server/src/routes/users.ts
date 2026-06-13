import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { discordAccounts: true, vaults: true, sessions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ users });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const isAdmin = req.user!.role === "ADMIN";
    const isSelf = req.user!.userId === req.params.id;

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: isSelf || isAdmin ? true : false,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isVerified: isAdmin ? true : false,
        createdAt: true,
        discordAccounts: {
          select: {
            discordId: true,
            discordUsername: true,
            discordAvatar: true,
            guildCount: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

router.get("/:id/activity", authenticate, async (req: Request, res: Response) => {
  try {
    const isAdmin = req.user!.role === "ADMIN";
    const isSelf = req.user!.userId === req.params.id;

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const logs = await prisma.auditLog.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ activity: logs });
  } catch (err) {
    console.error("Get activity error:", err);
    res.status(500).json({ error: "Failed to get activity" });
  }
});

router.put("/:id/role", authenticate, requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const { role } = req.body;

    if (!["ADMIN", "MODERATOR", "USER"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_ROLE",
        userId: req.user!.userId,
        details: `Changed ${user.username}'s role to ${role}`,
        ipAddress: req.ip,
      },
    });

    res.json({ user });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

export default router;

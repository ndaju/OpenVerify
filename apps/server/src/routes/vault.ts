import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { vaultLimiter } from "../middleware/rateLimiter";
import { encrypt, decrypt } from "@openverify/crypto";
import { config } from "../config";

const router = Router();

const createVaultSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  data: z.string(),
  visibility: z.enum(["PRIVATE", "TEAM", "ORGANIZATION", "PUBLIC"]).optional(),
});

const updateVaultSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  visibility: z.enum(["PRIVATE", "TEAM", "ORGANIZATION", "PUBLIC"]).optional(),
});

const shareVaultSchema = z.object({
  userId: z.string(),
  canRead: z.boolean().optional(),
  canWrite: z.boolean().optional(),
});

router.post("/", authenticate, vaultLimiter, validate(createVaultSchema), async (req: Request, res: Response) => {
  try {
    const { name, description, data, visibility } = req.body;

    const { encrypted, iv, authTag } = encrypt(data, config.vault.encryptionKey);

    const vault = await prisma.vault.create({
      data: {
        name,
        description,
        encryptedData: encrypted,
        iv,
        authTag,
        visibility: visibility || "PRIVATE",
        ownerId: req.user!.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_VAULT",
        userId: req.user!.userId,
        details: `Created vault: ${name}`,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      id: vault.id,
      name: vault.name,
      description: vault.description,
      visibility: vault.visibility,
      isLocked: vault.isLocked,
      createdAt: vault.createdAt,
    });
  } catch (err) {
    console.error("Create vault error:", err);
    res.status(500).json({ error: "Failed to create vault" });
  }
});

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const vaults = await prisma.vault.findMany({
      where: {
        OR: [
          { ownerId: req.user!.userId },
          { allowedUsers: { some: { userId: req.user!.userId } } },
          { visibility: "PUBLIC" },
        ],
      },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { allowedUsers: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({
      vaults: vaults.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
        visibility: v.visibility,
        isLocked: v.isLocked,
        accessCount: v.accessCount,
        lastAccessedAt: v.lastAccessedAt,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        owner: v.owner,
        sharedCount: v._count.allowedUsers,
      })),
    });
  } catch (err) {
    console.error("List vaults error:", err);
    res.status(500).json({ error: "Failed to list vaults" });
  }
});

router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
        allowedUsers: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        },
      },
    });

    if (!vault) {
      res.status(404).json({ error: "Vault not found" });
      return;
    }

    const isOwner = vault.ownerId === req.user!.userId;
    const hasAccess = vault.allowedUsers.some((a) => a.userId === req.user!.userId);
    const isPublic = vault.visibility === "PUBLIC";

    if (!isOwner && !hasAccess && !isPublic) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.vault.update({
      where: { id: vault.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "READ_VAULT",
        userId: req.user!.userId,
        details: `Accessed vault: ${vault.name}`,
        ipAddress: req.ip,
      },
    });

    res.json({
      id: vault.id,
      name: vault.name,
      description: vault.description,
      visibility: vault.visibility,
      isLocked: vault.isLocked,
      accessCount: vault.accessCount + 1,
      lastAccessedAt: new Date(),
      createdAt: vault.createdAt,
      updatedAt: vault.updatedAt,
      owner: vault.owner,
      sharedWith: vault.allowedUsers.map((a) => ({
        id: a.user.id,
        username: a.user.username,
        avatarUrl: a.user.avatarUrl,
        canRead: a.canRead,
        canWrite: a.canWrite,
      })),
    });
  } catch (err) {
    console.error("Get vault error:", err);
    res.status(500).json({ error: "Failed to get vault" });
  }
});

router.post("/:id/unlock", authenticate, async (req: Request, res: Response) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { id: req.params.id },
      include: {
        allowedUsers: { where: { userId: req.user!.userId } },
      },
    });

    if (!vault) {
      res.status(404).json({ error: "Vault not found" });
      return;
    }

    const isOwner = vault.ownerId === req.user!.userId;
    const hasReadAccess = vault.allowedUsers.some((a) => a.canRead);

    if (!isOwner && !hasReadAccess && vault.visibility !== "PUBLIC") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    try {
      const decrypted = decrypt(vault.encryptedData, vault.iv, vault.authTag, config.vault.encryptionKey);
      const fileMetadata = vault.encryptedFileMetadata
        ? decrypt(vault.encryptedFileMetadata, vault.iv, vault.authTag, config.vault.encryptionKey)
        : null;

      res.json({
        id: vault.id,
        name: vault.name,
        data: decrypted,
        fileMetadata: fileMetadata ? JSON.parse(fileMetadata) : null,
      });
    } catch {
      res.status(500).json({ error: "Failed to decrypt vault data" });
    }
  } catch (err) {
    console.error("Unlock vault error:", err);
    res.status(500).json({ error: "Failed to unlock vault" });
  }
});

router.put("/:id", authenticate, validate(updateVaultSchema), async (req: Request, res: Response) => {
  try {
    const vault = await prisma.vault.findUnique({ where: { id: req.params.id } });

    if (!vault) {
      res.status(404).json({ error: "Vault not found" });
      return;
    }

    if (vault.ownerId !== req.user!.userId) {
      res.status(403).json({ error: "Only the owner can update this vault" });
      return;
    }

    const updated = await prisma.vault.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_VAULT",
        userId: req.user!.userId,
        details: `Updated vault: ${vault.name}`,
        ipAddress: req.ip,
      },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      visibility: updated.visibility,
      isLocked: updated.isLocked,
    });
  } catch (err) {
    console.error("Update vault error:", err);
    res.status(500).json({ error: "Failed to update vault" });
  }
});

router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const vault = await prisma.vault.findUnique({ where: { id: req.params.id } });

    if (!vault) {
      res.status(404).json({ error: "Vault not found" });
      return;
    }

    if (vault.ownerId !== req.user!.userId) {
      res.status(403).json({ error: "Only the owner can delete this vault" });
      return;
    }

    await prisma.vault.delete({ where: { id: req.params.id } });

    await prisma.auditLog.create({
      data: {
        action: "DELETE_VAULT",
        userId: req.user!.userId,
        details: `Deleted vault: ${vault.name}`,
        ipAddress: req.ip,
      },
    });

    res.json({ message: "Vault deleted successfully" });
  } catch (err) {
    console.error("Delete vault error:", err);
    res.status(500).json({ error: "Failed to delete vault" });
  }
});

router.post("/:id/share", authenticate, validate(shareVaultSchema), async (req: Request, res: Response) => {
  try {
    const vault = await prisma.vault.findUnique({ where: { id: req.params.id } });

    if (!vault) {
      res.status(404).json({ error: "Vault not found" });
      return;
    }

    if (vault.ownerId !== req.user!.userId) {
      res.status(403).json({ error: "Only the owner can share this vault" });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: req.body.userId } });
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const access = await prisma.vaultAccess.upsert({
      where: {
        vaultId_userId: {
          vaultId: vault.id,
          userId: req.body.userId,
        },
      },
      update: {
        canRead: req.body.canRead ?? true,
        canWrite: req.body.canWrite ?? false,
      },
      create: {
        vaultId: vault.id,
        userId: req.body.userId,
        canRead: req.body.canRead ?? true,
        canWrite: req.body.canWrite ?? false,
      },
    });

    res.json({
      message: "Vault shared successfully",
      access: {
        userId: access.userId,
        canRead: access.canRead,
        canWrite: access.canWrite,
      },
    });
  } catch (err) {
    console.error("Share vault error:", err);
    res.status(500).json({ error: "Failed to share vault" });
  }
});

router.delete("/:id/share/:userId", authenticate, async (req: Request, res: Response) => {
  try {
    const vault = await prisma.vault.findUnique({ where: { id: req.params.id } });

    if (!vault) {
      res.status(404).json({ error: "Vault not found" });
      return;
    }

    if (vault.ownerId !== req.user!.userId) {
      res.status(403).json({ error: "Only the owner can remove access" });
      return;
    }

    await prisma.vaultAccess.deleteMany({
      where: {
        vaultId: vault.id,
        userId: req.params.userId,
      },
    });

    res.json({ message: "Access revoked successfully" });
  } catch (err) {
    console.error("Remove access error:", err);
    res.status(500).json({ error: "Failed to remove access" });
  }
});

export default router;

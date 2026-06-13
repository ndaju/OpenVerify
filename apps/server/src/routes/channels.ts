import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const messageSchema = z.object({
  content: z.string().min(1).max(4000),
  parentId: z.string().optional(),
});

router.get("/:guildId", authenticate, async (req: Request, res: Response) => {
  try {
    const guild = await prisma.guild.findFirst({
      where: {
        discordId: req.params.guildId,
        ownerId: req.user!.userId,
      },
    });

    if (!guild) {
      res.status(404).json({ error: "Guild not found or not accessible" });
      return;
    }

    const channels = await prisma.channel.findMany({
      where: { guildId: guild.id },
      orderBy: { position: "asc" },
    });

    res.json({ channels });
  } catch (err) {
    console.error("List channels error:", err);
    res.status(500).json({ error: "Failed to list channels" });
  }
});

router.get("/:guildId/:channelId/messages", authenticate, async (req: Request, res: Response) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { discordId: req.params.channelId },
      include: { guild: true },
    });

    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }

    if (channel.guild.ownerId !== req.user!.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const cursor = req.query.cursor as string | undefined;

    const messages = await prisma.message.findMany({
      where: { channelId: channel.id },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        attachments: true,
        reactions: true,
        _count: { select: { replies: true } },
      },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    res.json({
      messages: data.reverse(),
      nextCursor: hasMore ? data[0]?.id : null,
    });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

router.post("/:guildId/:channelId/messages", authenticate, validate(messageSchema), async (req: Request, res: Response) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { discordId: req.params.channelId },
      include: { guild: true },
    });

    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }

    if (channel.guild.ownerId !== req.user!.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const message = await prisma.message.create({
      data: {
        content: req.body.content,
        channelId: channel.id,
        authorId: req.user!.userId,
        parentId: req.body.parentId || null,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "SEND_MESSAGE",
        userId: req.user!.userId,
        details: `Message in #${channel.name}`,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({ message });
  } catch (err) {
    console.error("Create message error:", err);
    res.status(500).json({ error: "Failed to create message" });
  }
});

router.delete("/:guildId/:channelId/messages/:messageId", authenticate, async (req: Request, res: Response) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { discordId: req.params.channelId },
      include: { guild: true },
    });

    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id: req.params.messageId },
    });

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const isAuthor = message.authorId === req.user!.userId;
    const isOwner = channel.guild.ownerId === req.user!.userId;

    if (!isAuthor && !isOwner) {
      res.status(403).json({ error: "Not authorized to delete this message" });
      return;
    }

    await prisma.message.delete({ where: { id: message.id } });

    await prisma.auditLog.create({
      data: {
        action: "DELETE_MESSAGE",
        userId: req.user!.userId,
        details: `Deleted message in #${channel.name}`,
        ipAddress: req.ip,
      },
    });

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;

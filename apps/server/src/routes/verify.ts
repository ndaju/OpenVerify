import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { getBot } from "../bot";

const router = Router();

router.get("/token", async (req: Request, res: Response) => {
  try {
    const { token, guild } = req.query;

    if (typeof token !== "string" || typeof guild !== "string") {
      res.status(400).json({ error: "Missing token or guild parameter" });
      return;
    }

    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!vt || vt.guildId !== guild) {
      res.status(404).json({ error: "Invalid verification link" });
      return;
    }

    if (vt.usedAt) {
      res.status(400).json({ error: "This verification link has already been used" });
      return;
    }

    if (vt.expiresAt < new Date()) {
      res.status(400).json({ error: "This verification link has expired" });
      return;
    }

    const guildConfig = await prisma.guildConfig.findUnique({
      where: { guildDiscordId: guild },
    });

    res.json({
      valid: true,
      discordId: vt.discordId,
      guildId: guild,
      guildName: guildConfig?.logChannelId ? "Configured" : "Pending setup",
    });
  } catch (err) {
    console.error("Verify token error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/callback", authenticate, async (req: Request, res: Response) => {
  try {
    const { token, guildId } = req.body;

    if (!token || !guildId) {
      res.status(400).json({ error: "Missing token or guildId" });
      return;
    }

    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!vt || vt.guildId !== guildId) {
      res.status(404).json({ error: "Invalid verification token" });
      return;
    }

    if (vt.usedAt) {
      res.status(400).json({ error: "Token already used" });
      return;
    }

    if (vt.expiresAt < new Date()) {
      res.status(400).json({ error: "Token expired" });
      return;
    }

    await prisma.verificationToken.update({
      where: { id: vt.id },
      data: { usedAt: new Date(), userId: req.user!.userId },
    });

    const guildConfig = await prisma.guildConfig.findUnique({
      where: { guildDiscordId: guildId },
    });

    const bot = getBot();
    if (bot && guildConfig?.verifiedRoleId) {
      try {
        const guild = await bot.guilds.fetch(guildId);
        const member = await guild.members.fetch(vt.discordId);
        await member.roles.add(guildConfig.verifiedRoleId);

        await prisma.auditLog.create({
          data: {
            action: "GRANT_ROLE",
            userId: req.user!.userId,
            details: `Assigned verified role to ${member.user.tag} in ${guild.name}`,
          },
        });

        if (guildConfig.logChannelId) {
          const logChannel = await guild.channels.fetch(guildConfig.logChannelId).catch(() => null);
          if (logChannel?.isTextBased()) {
            await logChannel.send({
              content: `✅ **${member.user.tag}** has been verified and granted <@&${guildConfig.verifiedRoleId}>`,
            });
          }
        }
      } catch (err) {
        console.error("Failed to assign role:", err);
      }
    }

    await prisma.auditLog.create({
      data: {
        action: "VERIFY_USER",
        userId: req.user!.userId,
        details: `User verified via Discord OAuth2 for guild ${guildId}`,
      },
    });

    res.json({ message: "Verification successful" });
  } catch (err) {
    console.error("Verify callback error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/guild/:guildId/config", authenticate, async (req: Request, res: Response) => {
  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildDiscordId: req.params.guildId },
    });

    if (!config) {
      res.status(404).json({ error: "No configuration found for this guild" });
      return;
    }

    res.json({ config });
  } catch (err) {
    console.error("Get guild config error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

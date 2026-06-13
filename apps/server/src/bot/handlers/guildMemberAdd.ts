import { Client, EmbedBuilder } from "discord.js";
import { prisma } from "../../lib/prisma";
import { generateToken } from "@openverify/crypto";
import { config } from "../../config";

const APP_URL = config.corsOrigin;

export function registerHandlers(client: Client): void {
  client.on("guildMemberAdd", async (member) => {
    try {
      const guildConfig = await prisma.guildConfig.findUnique({
        where: { guildDiscordId: member.guild.id },
      });

      if (!guildConfig?.isEnabled) return;

      const existing = await prisma.verificationToken.findFirst({
        where: { discordId: member.id, guildId: member.guild.id, usedAt: null },
      });

      if (existing && existing.expiresAt > new Date()) return;

      const token = generateToken(24);
      const verifyUrl = `${APP_URL}/verify?token=${token}&guild=${member.guild.id}`;

      await prisma.verificationToken.create({
        data: {
          token,
          discordId: member.id,
          guildId: member.guild.id,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Welcome! Please Verify")
        .setDescription(
          guildConfig.welcomeMessage?.replace("{user}", member.toString()) ||
            `Welcome ${member.toString()}! Click the link below to verify.`
        )
        .addFields({ name: "Verify", value: `[Click here to verify](${verifyUrl})` })
        .setFooter({ text: "This link expires in 30 minutes" })
        .setTimestamp();

      await member.send({ embeds: [embed] }).catch(() => {
        // DM might be closed, silently fail
      });

      await prisma.auditLog.create({
        data: {
          action: "BOT_JOIN",
          userId: member.id,
          details: `Sent verification DM to ${member.user.tag} in ${member.guild.name}`,
        },
      });
    } catch (err) {
      console.error("guildMemberAdd error:", err);
    }
  });
}

import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { config } from "../config";
import { generateToken } from "@openverify/crypto";

const router = Router();

const DISCORD_API = "https://discord.com/api/v10";

interface DiscordTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

interface DiscordGuildResponse {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  member_count?: number;
}

async function exchangeCode(code: string): Promise<DiscordTokenResponse> {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    client_secret: config.discord.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.discord.redirectUri,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Discord token exchange failed: ${error}`);
  }

  return res.json() as Promise<DiscordTokenResponse>;
}

async function refreshDiscordToken(refreshToken: string): Promise<DiscordTokenResponse> {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    client_secret: config.discord.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh Discord token");
  }

  return res.json() as Promise<DiscordTokenResponse>;
}

async function fetchDiscordUser(accessToken: string): Promise<DiscordUserResponse> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Discord user");
  }

  return res.json() as Promise<DiscordUserResponse>;
}

async function fetchUserGuilds(accessToken: string): Promise<DiscordGuildResponse[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user guilds");
  }

  return res.json() as Promise<DiscordGuildResponse[]>;
}

router.get("/auth", (req: Request, res: Response) => {
  const { state } = req.query;
  const redirectState = typeof state === "string" ? state : generateToken(16);

  const authorizeUrl = new URL(`${DISCORD_API}/oauth2/authorize`);
  authorizeUrl.searchParams.set("client_id", config.discord.clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", config.discord.redirectUri);
  authorizeUrl.searchParams.set("scope", "identify email guilds");
  authorizeUrl.searchParams.set("state", redirectState);
  authorizeUrl.searchParams.set("prompt", "consent");

  res.json({ url: authorizeUrl.toString(), state: redirectState });
});

router.get("/callback", authenticate, async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (typeof code !== "string") {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    const tokenData = await exchangeCode(code);
    const discordUser = await fetchDiscordUser(tokenData.access_token);

    const existing = await prisma.discordAccount.findUnique({
      where: { discordId: discordUser.id },
    });

    if (existing && existing.userId !== req.user!.userId) {
      res.status(409).json({ error: "Discord account already linked to another user" });
      return;
    }

    const account = await prisma.discordAccount.upsert({
      where: { discordId: discordUser.id },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
        discordAvatar: discordUser.avatar,
        userId: req.user!.userId,
      },
      create: {
        discordId: discordUser.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
        discordAvatar: discordUser.avatar,
        guildCount: 0,
        userId: req.user!.userId,
      },
    });

    const guilds = await fetchUserGuilds(tokenData.access_token);
    await prisma.discordAccount.update({
      where: { id: account.id },
      data: { guildCount: guilds.length },
    });

    for (const guild of guilds) {
      await prisma.guild.upsert({
        where: { discordId: guild.id },
        update: {
          name: guild.name,
          iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
          memberCount: guild.member_count || 0,
        },
        create: {
          discordId: guild.id,
          name: guild.name,
          iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
          memberCount: guild.member_count || 0,
          ownerId: req.user!.userId,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "OAUTH_CONNECT",
        userId: req.user!.userId,
        details: `Linked Discord account ${discordUser.username}#${discordUser.discriminator}`,
        ipAddress: req.ip,
      },
    });

    res.json({
      message: "Discord account linked successfully",
      account: {
        discordId: account.discordId,
        discordUsername: account.discordUsername,
        discordAvatar: account.discordAvatar,
        guildCount: guilds.length,
      },
    });
  } catch (err) {
    console.error("Discord callback error:", err);
    res.status(500).json({ error: "Failed to link Discord account" });
  }
});

router.get("/guilds", authenticate, async (req: Request, res: Response) => {
  try {
    const account = await prisma.discordAccount.findFirst({
      where: { userId: req.user!.userId },
    });

    if (!account) {
      res.status(404).json({ error: "No Discord account linked" });
      return;
    }

    let accessToken = account.accessToken;

    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      if (!account.refreshToken) {
        res.status(401).json({ error: "Discord token expired, please re-link" });
        return;
      }
      const refreshed = await refreshDiscordToken(account.refreshToken);
      accessToken = refreshed.access_token;

      await prisma.discordAccount.update({
        where: { id: account.id },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
    }

    const guilds = await fetchUserGuilds(accessToken);

    const storedGuilds = await prisma.guild.findMany({
      where: { ownerId: req.user!.userId },
      select: { discordId: true, isBackedUp: true },
    });

    const backupMap = new Map(storedGuilds.map((g) => [g.discordId, g.isBackedUp]));

    const enrichedGuilds = guilds.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      isBackedUp: backupMap.get(g.id) || false,
    }));

    res.json({ guilds: enrichedGuilds });
  } catch (err) {
    console.error("Guilds error:", err);
    res.status(500).json({ error: "Failed to fetch guilds" });
  }
});

router.delete("/disconnect", authenticate, async (req: Request, res: Response) => {
  try {
    const account = await prisma.discordAccount.findFirst({
      where: { userId: req.user!.userId },
    });

    if (!account) {
      res.status(404).json({ error: "No Discord account linked" });
      return;
    }

    await prisma.discordAccount.delete({ where: { id: account.id } });

    await prisma.auditLog.create({
      data: {
        action: "OAUTH_DISCONNECT",
        userId: req.user!.userId,
        ipAddress: req.ip,
      },
    });

    res.json({ message: "Discord account disconnected" });
  } catch (err) {
    console.error("Disconnect error:", err);
    res.status(500).json({ error: "Failed to disconnect Discord account" });
  }
});

export default router;

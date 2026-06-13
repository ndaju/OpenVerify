import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "../config";

const commands = [
  new SlashCommandBuilder()
    .setName("verify-setup")
    .setDescription("Set the verified role for this server")
    .addRoleOption((o) =>
      o.setName("role").setDescription("Role to assign after verification").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("verify-channel")
    .setDescription("Set the log channel for verification events")
    .addChannelOption((o) =>
      o.setName("channel").setDescription("Channel for verification logs").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("verify-message")
    .setDescription("Set the welcome message for new members")
    .addStringOption((o) =>
      o.setName("message").setDescription("Use {user} for mention").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("verify-toggle")
    .setDescription("Enable or disable verification for this server")
    .addBooleanOption((o) =>
      o.setName("enabled").setDescription("Enable or disable verification").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("verify-status")
    .setDescription("Show current verification configuration"),
];

export async function deployCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(config.discord.botToken);

  try {
    const data = (await rest.put(Routes.applicationCommands(config.discord.clientId), {
      body: commands.map((c) => c.toJSON()),
    })) as unknown[];
    console.log(`Registered ${data.length} slash commands`);
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
}

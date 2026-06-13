import { Interaction, EmbedBuilder } from "discord.js";
import { prisma } from "../../lib/prisma";

export async function handleInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guild } = interaction;

  if (!guild) {
    await interaction.reply({ content: "This command must be used in a server.", ephemeral: true });
    return;
  }

  try {
    switch (commandName) {
      case "verify-setup":
        await handleSetup(interaction);
        break;
      case "verify-channel":
        await handleChannel(interaction);
        break;
      case "verify-message":
        await handleMessage(interaction);
        break;
      case "verify-toggle":
        await handleToggle(interaction);
        break;
      case "verify-status":
        await handleStatus(interaction);
        break;
    }
  } catch (err) {
    console.error(`Command ${commandName} error:`, err);
    await interaction
      .reply({ content: "An error occurred. Please try again.", ephemeral: true })
      .catch(() => {});
  }
}

async function handleSetup(interaction: any) {
  const role = interaction.options.getRole("role");
  if (!role) return;

  await prisma.guildConfig.upsert({
    where: { guildDiscordId: interaction.guild.id },
    update: { verifiedRoleId: role.id },
    create: { guildDiscordId: interaction.guild.id, verifiedRoleId: role.id },
  });

  await interaction.reply({
    content: `✅ Verified role set to **${role.name}**`,
    ephemeral: true,
  });
}

async function handleChannel(interaction: any) {
  const channel = interaction.options.getChannel("channel");
  if (!channel) return;

  await prisma.guildConfig.upsert({
    where: { guildDiscordId: interaction.guild.id },
    update: { logChannelId: channel.id },
    create: { guildDiscordId: interaction.guild.id, logChannelId: channel.id },
  });

  await interaction.reply({
    content: `✅ Log channel set to **#${channel.name}**`,
    ephemeral: true,
  });
}

async function handleMessage(interaction: any) {
  const message = interaction.options.getString("message");

  await prisma.guildConfig.upsert({
    where: { guildDiscordId: interaction.guild.id },
    update: { welcomeMessage: message },
    create: { guildDiscordId: interaction.guild.id, welcomeMessage: message },
  });

  await interaction.reply({
    content: `✅ Welcome message updated`,
    ephemeral: true,
  });
}

async function handleToggle(interaction: any) {
  const enabled = interaction.options.getBoolean("enabled");

  await prisma.guildConfig.upsert({
    where: { guildDiscordId: interaction.guild.id },
    update: { isEnabled: enabled },
    create: { guildDiscordId: interaction.guild.id, isEnabled: enabled },
  });

  await interaction.reply({
    content: `✅ Verification ${enabled ? "enabled" : "disabled"} for this server`,
    ephemeral: true,
  });
}

async function handleStatus(interaction: any) {
  const config = await prisma.guildConfig.findUnique({
    where: { guildDiscordId: interaction.guild.id },
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Verification Status")
    .addFields(
      { name: "Status", value: config?.isEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      {
        name: "Verified Role",
        value: config?.verifiedRoleId ? `<@&${config.verifiedRoleId}>` : "Not set",
        inline: true,
      },
      {
        name: "Log Channel",
        value: config?.logChannelId ? `<#${config.logChannelId}>` : "Not set",
        inline: true,
      }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

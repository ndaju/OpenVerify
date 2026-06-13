import { Client, GatewayIntentBits, Partials } from "discord.js";
import { config } from "../config";
import { registerHandlers } from "./handlers/guildMemberAdd";
import { handleInteraction } from "./handlers/interactionCreate";
import { deployCommands } from "./deployCommands";

export { deployCommands };

let client: Client | null = null;

export function getBot(): Client | null {
  return client;
}

export async function startBot(): Promise<Client> {
  if (client) return client;

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  client.once("ready", () => {
    console.log(`Bot logged in as ${client!.user?.tag}`);
  });

  registerHandlers(client);
  client.on("interactionCreate", handleInteraction);

  await client.login(config.discord.botToken);
  return client;
}

export async function stopBot(): Promise<void> {
  if (!client) return;
  client.destroy();
  client = null;
}

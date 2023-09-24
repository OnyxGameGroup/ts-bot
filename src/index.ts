import config from './config';
import AppDataSource from './database';
import Discord, { EmbedBuilder, REST, Routes, resolveColor } from 'discord.js';
import { ActionEnum, ModerationEntity } from './entities/moderation.entity';
import fs from 'fs';
AppDataSource.initialize().then(() => {
    console.log("Data Source has been initialized!")
}).catch((err) => {
    console.error("Error during Data Source initialization", err)
})

const client = new Discord.Client({
    intents: [Discord.GatewayIntentBits.DirectMessages, Discord.GatewayIntentBits.GuildMembers, Discord.GatewayIntentBits.Guilds],
    partials: [Discord.Partials.Channel, Discord.Partials.GuildMember, Discord.Partials.User],
});

export const liveChannels: any[] = [];

export var commandsCentral: any = new Discord.Collection();
export async function newModeration(moderation: ModerationEntity) {
    for (const channel of liveChannels) {
        channel
            .send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(resolveColor("Blue"))
                        .setTitle("New Moderation")
                        .setFooter({ text: "RoLogs" })
                        .setFields([
                            {
                                name: "Suspect",
                                value: moderation.suspect,
                                inline: true,
                            },
                            {
                                name: "Action",
                                value: moderation.action.charAt(0).toUpperCase() + moderation.action.slice(1),
                                inline: true,
                            },
                            {
                                name: "Moderator",
                                value: moderation.moderator,
                                inline: true,
                            },
                        ])
                        .addFields(
                            moderation.moderatorNote
                                ? [
                                    {
                                        name: "Note",
                                        value: moderation.moderatorNote,
                                    },
                                ]
                                : [],
                        ),
                ],
            })
            .catch((err) => console.warn(err.stack));
    }
}

client.once('ready', async () => {
    console.log('bot ready');
  
    try {
      // @ts-ignore
      client.guild = await client.guilds.fetch(config.whitelist.targetGuild);
      console.log('fetched target guild [' + config.whitelist.targetGuild + ']');
  
      const commands = await registerCommands(client.token, client.user.id);
      // @ts-ignore
      client.commands = new Discord.Collection(commands.map((command) => [command.name, command]));
    } catch (error) {
      console.error(error);
    }
  });

  client.on("interactionCreate", async (interaction: any) => {
	if (!interaction.isCommand()) return;
    // @ts-ignore
	const command = client.commands.find((command) => command.name === interaction.commandName);
	if (!command) return;

	if (interaction.guild) {
		if (!interaction.member.roles.cache.find((role) => role.id === config.whitelist.targetRole)) return;
	} else {
		try {
            // @ts-ignore
			const member = await client.guild.members.fetch(interaction.user.id);
			if (!member) return;
			if (!member.roles.cache.find((role) => role.id === config.whitelist.targetRole)) return;
		} catch (err) {
			return;
		}
	}

	command.f(interaction);

    const newModeration = new ModerationEntity();
    newModeration.suspect = interaction.user.id;
    newModeration.action = ActionEnum.LOG; // Replace 'ActionEnum.LOG' with the appropriate action
    newModeration.moderator = 'ModeratorName'; // Replace with the actual moderator's name
    newModeration.moderatorNote = 'Moderation Note'; // Replace with the actual note
    newModeration.date = new Date();
    
    // Save the new moderation record
    AppDataSource.getRepository(ModerationEntity)
      .save(newModeration)
      .then((savedModeration) => {
        // Handle success if needed
      })
      .catch((error) => {
        console.error(error);
      });
});

async function getREST(commands, token, clientId) {
        try {
            const rest = new REST({ version: '10' }).setToken(token);
            // console.log(commands)
            rest.put(Routes.applicationCommands(clientId), { body: commands });
            
        } catch (err) {
            console.log(err);
        }            
}

async function registerCommands(token, clientId) {
		const commands = await fs
			.readdirSync("src/commands/")
			.filter((file) => file.endsWith(".ts") && !file.startsWith("_"))
			
        const cmds = await Promise.all(
            commands.map(async (file) => await import(`./commands/${file}`))
        );

        console.log(cmds);
        
        getREST(
            // @ts-ignore
			cmds.map((cmd) => cmd.default.command),
			token,
			clientId,
		);

        return commands;
}

client.login(config.token)	
.then(() => console.log("logged into bot"))
.catch((err) => {
    console.error(err.stack);
    process.exit();
});
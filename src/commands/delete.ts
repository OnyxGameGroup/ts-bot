import AppDataSource from "../database";
import Discord from "discord.js";
import { ModerationEntity } from "../entities/moderation.entity";
import colors from "colors";
import config from "../config";



export default {
    command: {
		name: "delete",
		description: "Delete moderations",
		dm_permission: true,
		options: [
			{
				type: 3,
				name: "suspect",
				description: "Query value (exact)",
			},
			{
				type: 3,
				name: "moderator",
				description: "Query value (exact)",
			},
			{
				type: 3,
				name: "id",
				description: "Query value (exact)",
			},
			{
				type: 3,
				name: "action",
				description: "Query value (exact)",
				choices: [
					{
						name: "Log",
						value: "log",
					},
					{
						name: "Kick",
						value: "kick",
					},
					{
						name: "Ban",
						value: "ban",
					},
					{
						name: "Warn",
						value: "warn",
					},
				],
			},
			{
				type: 3,
				name: "note",
				description: "Query value (regex)",
			},
		],
	},
    f: async function (command: Discord.CommandInteraction) {
    
        const ephemeral = !!command.guild;
        if (!config.whitelist.deletePermissions.includes(command.user.id)) {
            return command.reply({
                ephemeral,
                content: "You do not have permission to use this command.",
            });
        }
        await command.deferReply({ ephemeral });
    
        let query: any = {};
        if (command.options.get("suspect")) query.suspect = command.options.get("suspect");
        if (command.options.get("action")) query.action = command.options.get("action");
        if (command.options.get("moderator")) query.moderator = command.options.get("moderator");
        if (command.options.get("note")) query.moderationNote = { $regex: command.options.get("note") };
        if (command.options.get("id")) {
            query["$or"] = [
                { id: command.options.get("id") },
                { uuid: command.options.get("id") },
            ];
        }
    
        const logs = await AppDataSource.getRepository(ModerationEntity).find({ where: query });
    
        const reply = await command.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`You are about to delete **${logs.length} moderations**, are you sure?`),
            ],
            components: [
                new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                .addComponents(
                    new Discord.ButtonBuilder().setLabel("I'm sure").setStyle(Discord.ButtonStyle.Danger).setCustomId("delete"),
                    new Discord.ButtonBuilder()
                        .setLabel("I don't want to do this, go back!")
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setCustomId("cancel"),
                ),
            ],
            
        })
    
        reply.fetch(true).then(
            (reply) => {
                const collector = reply.createMessageComponentCollector({
                    max: 1,
                    filter: (i) => i.user.id === command.user.id,
                    time: 5 * 60 * 1000, // 5 minutes
                });
                collector.once("collect", (buttonInteraction) => {
                    switch (buttonInteraction.customId) {
                        case "cancel":
                            buttonInteraction.update({
                                embeds: [new Discord.EmbedBuilder().setColor('Orange').setDescription(`Cancelled.`)],
                                components: [],
                            });
                            break;
                        case "delete":
                            AppDataSource.getRepository(ModerationEntity).delete(query).then(() => {
                                buttonInteraction.update({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setColor('Green')
                                            .setDescription(`Deleted ${logs.length} moderations.`),
                                    ],
                                    components: [],
                                });
                            }).catch(() => {
                                buttonInteraction.update({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setColor('Orange')
                                            .setDescription(`There was an error completing the deletion.`),
                                    ],
                                    components: [],
                                });
                            });
                            break;
                    }
                });
            }
        )
    }
}
import config from "../config";
import AppDataSource from "../database";
import Discord from "discord.js";
import { ModerationEntity } from "../entities/moderation.entity";
import { Repository } from "typeorm";

export default {
    command: {
		name: "search",
		description: "Search for moderations",
		dm_permission: true,
		options: [
			{
				type: 4,
				name: "limit",
				description: "The maximum amount of moderations to get",
				max_value: config.maxModerationsInSearch,
				min_value: 1,
			},
			{
				type: 4,
				name: "offset",
				description: "Skip x amount of moderations before returning results",
			},
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
	f: async function (command) {
        const ephemeral = !!command.guild;
        await command.deferReply({ ephemeral });
      
        let query: any = {};
        if (command.options.get('suspect')?.value) query.suspect = command.options.get('suspect')?.value;
        if (command.options.get('action')?.value) query.action = command.options.get('action')?.value;
        if (command.options.get('moderator')?.value) query.moderator = command.options.get('moderator')?.value;
        if (command.options.get('note')?.value) query.moderatorNote = { $regex: command.options.get('note')?.value };
        if (command.options.get('id')?.value)
          query['$or'] = [{ id: command.options.get('id')?.value }, { uuid: command.options.get('id')?.value }];
      
        const moderationRepository: Repository<ModerationEntity> = AppDataSource.getRepository(ModerationEntity);
      
        try {
          const logs = await moderationRepository.find({
            where: query,
            order: { date: 'DESC' },
            take: Number(command.options.get('limit')?.value) || config.maxModerationsInSearch || 100,
            skip: Number(command.options.get('offset')?.value) || 0,
          });
      
          if (logs.length === 0) {
            command.editReply({
              content: '0 moderations found.',
            });
          } else {
            let currentPage = 0;
            const pages = [];
            const amountOfModerations = await moderationRepository.count();
            const buttons: any[] = [
              { customId: 'previous', emoji: '⏮', style: 'PRIMARY' },
              { customId: 'next', emoji: '⏭', style: 'PRIMARY' },
            ];
      
            if (!ephemeral) {
              buttons.push({ label: 'Close', style: 'DANGER', customId: 'close' });
            }
      
            for (const index in logs) {
              const targetPage = Math.floor(Number(index) / (config.maxModerationsInPage || 10));
              if (!pages[targetPage]) pages[targetPage] = [];
              pages[targetPage].push(logs[index]);
            }
      
            async function updatePages() {
                let reply = undefined;
              if (pages[currentPage]) {
                let fields: any[] = [];
                for (const moderationIndex in pages[currentPage]) {
                  const moderation = pages[currentPage]?.[moderationIndex];
                  if (!moderation) continue;
                  fields.push({
                    name: moderation.action.toUpperCase() + ' - ' + moderation.id,
                    value: `<t:${Math.floor(moderation.date.getTime() / 1000)}:F>\n${moderation.suspect} | ${
                      moderation.moderator
                    }${!!moderation.moderatorNote ? '\n```\n' + moderation.moderatorNote + '```' : ''}\n`,
                  });
                }
      
                async function callback(message: any) {
                  const collector = message.createMessageComponentCollector({
                    max: 1,
                    time: 10 * 60 * 1000, // 10 minutes
                    filter: (i: any) => i.user.id === command.user.id,
                  });
                  collector.once('collect', (interaction: any) => {
                    const originalCurrentPage = currentPage;
      
                    switch (interaction.customId) {
                      case 'previous':
                        currentPage--;
                        break;
                      case 'next':
                        currentPage++;
                        break;
                      case 'close':
                        return interaction.message.delete();
                        break;
                    }
      
                    if (currentPage < 0 || currentPage > pages.length - 1) {
                      currentPage = originalCurrentPage;
      
                      interaction
                        .reply({
                          ephemeral: true,
                          content: 'Selected page does not exist.',
                        })
                        .then(() => callback(interaction.message));
                    } else {
                      reply = interaction;
                      updatePages();
                    }
                  });
                }
      
                const toSend = {
                  embeds: [
                    {
                      color: 'BLUE',
                      title: 'Page ' + (currentPage + 1) + '/' + pages.length,
                      footer: { text: `Showing ${logs.length} out of ${amountOfModerations} - RoLogs` },
                      fields,
                    },
                  ],
                  components: buttons,
                  fetchReply: true,
                };
      
                if (reply) {
                  reply
                    .update(toSend)
                    .then(callback)
                    .catch((e: Error) => {
                      console.warn(e.stack);
                    });
                } else {
                  command
                    .editReply(toSend)
                    .then(callback)
                    .catch((e: Error) => {
                      console.warn(e.stack);
                    });
                }
              } else {
                if (reply) {
                  reply.update({
                    embeds: [],
                    content: 'Could not get page.',
                  });
                } else {
                  command.editReply({
                    embeds: [],
                    content: 'Could not get page.',
                  });
                }
              }
            }
            updatePages();
          }
        } catch (error) {
          console.error(error);
        }
	},
}
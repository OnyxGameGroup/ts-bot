import Discord from 'discord.js';
import { liveChannels } from '../';
export default {
    command: {
		name: "stoplive",
		description: "Stop the incoming moderators in your DMs",
		dm_permission: true,
		options: [
			{
				type: 5,
				name: "dms",
				description: "Stop the incoming moderations in your DMs",
			},
		],
	},
    f: async (command: Discord.CommandInteraction) => {
        const sendToDMs = !!command.options.get('dms')?.value;
        const ephemeral = !!command.guild;
        let chosenChannel: Discord.DMChannel | Discord.TextChannel | null;
      
        if (sendToDMs) {
          if (command.user.dmChannel) {
            chosenChannel = command.user.dmChannel;
          } else {
            return command.reply({
              ephemeral,
              content: 'Could not find the DM channel.',
            });
          }
        } else {
          chosenChannel = command.channel as Discord.DMChannel | Discord.TextChannel;
        }
      
        const search = liveChannels.findIndex((channel) => channel?.id === chosenChannel?.id);
        if (search >= 0) {
            liveChannels.splice(search, 1);
          command.reply({
            ephemeral,
            content: 'Copy, new moderations will no longer be sent.',
          });
        } else {
          command.reply({
            ephemeral,
            content: `<#${chosenChannel.id}> isn't receiving moderations in real-time.`,
          });
        }
    }
}
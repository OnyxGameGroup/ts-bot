import config from "../config";
import Discord from "discord.js";
import { liveChannels } from "../";

export default {
    command: {
        name: "live",
		description: "Get all incoming moderations and send them to your DMs until you do '/stoplive'",
		dm_permission: true,
    },
    f: async function (command: Discord.CommandInteraction) {
        const ephemeral = !!command.guild;
    
        if (ephemeral) {
          if (config.whitelist.slashliveWhitelist.includes(command.channel.id)) {
            liveChannels.push(command.channel);
          } else {
            return command.reply({
              ephemeral,
              content: "/live cannot be used here.",
            });
          }
        } else {
          if (command.user.dmChannel) {
            if (!liveChannels.find((channel) => channel.id === command.user.dmChannel.id))
                liveChannels.push(command.user.dmChannel);
          } else {
            return command.reply({
              ephemeral,
              content: "Could not find the DM channel, try sending me *a* message or run this command in DMs.",
            });
          }
        }
    
        command
          .reply({
            ephemeral,
            content: `Registered, you will now get the moderations real-time in ${
              ephemeral ? "your DMs" : "here"
            } until you do '/stoplive'.`,
          })
          .then(() => {
            if (ephemeral) {
              command.user.dmChannel.send("You will be receiving new moderations real-time in here until you do '/stoplive'.");
            }
          });
    }
}

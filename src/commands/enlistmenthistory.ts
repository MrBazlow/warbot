import { TextChannel, codeBlock } from 'discord.js'
import { Command } from '@sapphire/framework'
import { table } from 'table'

import type { TableUserConfig } from 'table'

const CHANNEL_ID = '1097620947713933393'

export class UserCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'enlistmenthistory',
      description: 'Lookup a users verification history'
    })
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option //
            .setName('user')
            .setDescription('Discord user to lookup')
            .setRequired(true)
        )
    })
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    interaction.client.logger.info(
      `${interaction.user.tag} in #${
        interaction.channel instanceof TextChannel ? interaction.channel.name : 'somewhere'
      } called enlistmenthistory.`
    )

    await interaction.deferReply()

    const channel = interaction.client.channels.cache.get(CHANNEL_ID)

    const user = interaction.options.getString('user') ?? 'mystery user'

    if (channel instanceof TextChannel) {
      channel.messages
        .fetch()
        .then((messages) => {
          return messages.filter((message) => {
            message.content.includes(`Approved by ${user}`)
          })
        })
        .then((filteredMessages) => {
          console.log(user)
          console.log(filteredMessages)
        })
        .catch((error) => console.error(error))
    }
  }
}

import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework'
import errorMessage from '../lib/errorMessage.js'
import { EmbedBuilder } from 'discord.js'

import type { ButtonInteraction } from 'discord.js'

export class ButtonHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    })
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'qrfIgnore') {
      return this.none()
    }
    return this.some()
  }

  public async run(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true })

    try {
      const username = interaction.user.toString()
      const oldEmbed = interaction.message.embeds[0]
      const respondersField = oldEmbed.fields.find((entry) => entry.name === 'Responders')
      if (respondersField?.value.includes(username)) {
        respondersField.value = respondersField.value.replaceAll(`, ${username}`, '')
        respondersField.value = respondersField.value.replaceAll(username, '')
        const newEmbed = new EmbedBuilder(oldEmbed.toJSON())
        await interaction.message.edit({
          embeds: [newEmbed]
        })
        await interaction.message.thread?.members.remove(
          interaction.user.id,
          `${username} requested to leave the QRF Event`
        )
      }
      await interaction.deleteReply()
    } catch (error) {
      void errorMessage(error, interaction)
    }
  }
}

import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework'
import errorMessage from '../lib/errorMessage.js'
import { EmbedBuilder, GuildChannel, PermissionsBitField } from 'discord.js'
import informativeError from '../lib/informativeError.js'

import type { ButtonInteraction } from 'discord.js'

export class ButtonHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    })
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'qrfResolved') {
      return this.none()
    }
    return this.some()
  }

  public async run(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true })

    async function resolve() {
      const qrfMessage = interaction.message
      if (qrfMessage.thread && !qrfMessage.thread.locked) {
        await qrfMessage.thread.setLocked(true, 'QRF Resolved')
      }
      const oldEmbed = qrfMessage.embeds[0]
      const statusField = oldEmbed.fields.find((entry) => entry.name === 'Status')
      if (statusField !== undefined) {
        statusField.value = '🟢 RESOLVED'
      }
      const newEmbed = new EmbedBuilder(oldEmbed.toJSON())
      await interaction.message.edit({
        embeds: [newEmbed],
        components: []
      })
      await interaction.deleteReply()
    }

    async function notPermitted() {
      await informativeError('ಠ_ಠ', interaction)
    }

    try {
      const originalPosterId = interaction.message.embeds[0].fields.find(
        (field) => field.name === 'OP'
      )?.value
      if (interaction.user.toString() === originalPosterId) {
        return resolve()
      }
      if (
        interaction.channel instanceof GuildChannel &&
        interaction.member?.permissions === PermissionsBitField.Flags.ManageGuild.toString()
      ) {
        return resolve()
      }
      return notPermitted()
    } catch (error) {
      void errorMessage(error, interaction)
    }
  }
}

import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework'
import { ButtonInteraction } from 'discord.js'
import errorMessage from '../lib/errorMessage.js'

export class ButtonHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    })
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'qrfCancel') {
      return this.none()
    }
    const originalPosterId = interaction.message.embeds[0].fields.find(
      (field) => field.name === 'OP'
    )?.value
    if (interaction.user.toString() === originalPosterId) {
      return this.some()
    }
    return this.none()
  }

  public async run(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true })
    try {
      await interaction.message.delete()
      await interaction.deleteReply()
    } catch (error) {
      void errorMessage(error, interaction)
    }
  }
}

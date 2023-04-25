import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework'
import errorMessage from '../lib/errorMessage.js'
import { ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from 'discord.js'
import { Time, TimerManager } from '@sapphire/time-utilities'

import type { ButtonInteraction } from 'discord.js'
import { createPartitionedMessageRow } from '@sapphire/discord.js-utilities'

export class ButtonHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    })
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'qrfSubmit') {
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
      if (interaction.channel?.isTextBased()) {
        const actualMessageEmbeds = interaction.message.embeds[0]

        if (process.env.QRF_CHANNEL === undefined) {
          throw new Error('No QRF_CHANNEL set! Attempt to send QRF Failed!')
        }

        const qrfButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏃‍♂️')
          .setLabel(`On my way`)
          .setCustomId('qrfRespond')
        const qrfIgnore = new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔇')
          .setLabel('Not responding')
          .setCustomId('qrfIgnore')
        const qrfResolved = new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setEmoji('👍')
          .setLabel('Resolved')
          .setCustomId('qrfResolved')

        const qrfChannel = await interaction.client.channels.fetch(process.env.QRF_CHANNEL)
        if (qrfChannel instanceof TextChannel) {
          const qrfMessage = await qrfChannel.send({
            embeds: [actualMessageEmbeds],
            components: createPartitionedMessageRow([qrfButton, qrfIgnore, qrfResolved])
          })
          const threadName = actualMessageEmbeds.title ?? 'QRF Thread'
          const qrfThread = await qrfMessage.startThread({ name: threadName })
          await qrfThread.members.add(interaction.user)
          TimerManager.setTimeout(() => {
            if (!qrfThread.locked || qrfMessage.components.length > 0) {
              void qrfMessage
                .edit({ embeds: [...qrfMessage.embeds], components: [] })
                .then(async () => {
                  await qrfThread.setLocked(true, '24h since event')
                  await qrfThread.send({
                    content: 'This QRF event is now 24h, this thread is now closing'
                  })
                })
                .catch((error) => {
                  interaction.client.logger.error(error)
                })
            }
          }, Time.Hour * 24)
        } else {
          throw new Error(`There was a problem in the QRF Channel. It's not TextBased?`)
        }

        const submittedQRF = new EmbedBuilder()
          .setTitle('QRF Sent!')
          .setThumbnail(
            'https://cdn.discordapp.com/attachments/1025869440451100742/1099895163662372875/rotating_light.png'
          )
          .setDescription(`QRF Ping from ${interaction.user.toString()} has been sent!`)
          .setColor('#245682')
          .setTimestamp(Date.now())

        await interaction.message.delete()
        await interaction.editReply({ embeds: [submittedQRF] })
      }
    } catch (error) {
      void errorMessage(error, interaction)
    }
  }
}

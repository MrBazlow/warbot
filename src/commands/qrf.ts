import { Command } from '@sapphire/framework'
import { createPartitionedMessageRow } from '@sapphire/discord.js-utilities'
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildChannel,
  PermissionsBitField,
  ComponentType,
  TextChannel
} from 'discord.js'
import errorMessage from '../lib/errorMessage.js'
import { regionFriendlyNamesSchema } from '../schema.js'
import { Time, TimerManager } from '@sapphire/time-utilities'
import { Value } from '@sinclair/typebox/value'
import informativeError from '../lib/informativeError.js'

export class UserCommandCreateButton extends Command {
  public regionFriendlyNames = Value.Create(regionFriendlyNamesSchema)

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'qrf',
      description: `Create a QRF Alert`
    })
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option //
            .setName('region')
            .setDescription('Region to check')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option //
            .setName('description')
            .setDescription('QRF details')
            .setRequired(true)
        )
        .addAttachmentOption((option) =>
          option //
            .setName('screenshot')
            .setDescription('Image to include in your QRF Message')
            .setRequired(true)
        )
    })
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })
    const userAvatar = interaction.user.avatarURL() ?? ''
    const region = interaction.options
      .getString('region')
      ?.trim() as keyof typeof this.regionFriendlyNames
    const description = interaction.options.getString('description') ?? ''
    const image = interaction.options.getAttachment('screenshot')

    try {
      if (!(interaction.channel instanceof GuildChannel)) {
        await informativeError(
          'This channel is not a discord server channel, this command cannot be called here',
          interaction
        )
        return
      }
      if (process.env.QRF_CHANNEL === undefined) {
        await informativeError(
          'There is a problem with the channel ID for the QRF Channel',
          interaction
        )
        return
      }
      const qrfChannel = await interaction.client.channels.fetch(process.env.QRF_CHANNEL)
      if (!(qrfChannel instanceof TextChannel)) {
        await informativeError(
          'There is a problem with the designated QRF Channel, it does not accept text messages',
          interaction
        )
        return
      }
      const botPermissions = qrfChannel.permissionsFor(interaction.client.user)
      if (botPermissions === null) {
        await informativeError(
          'Cannot determine bot permissions, this command cannot be called',
          interaction
        )
        return
      }
      if (!botPermissions.has('ViewChannel')) {
        await informativeError(
          'Role permission "View Channel" is missing for QRF Channel',
          interaction
        )
        return
      }
      if (!botPermissions.has('CreatePublicThreads')) {
        await informativeError(
          'Role permission "Create Public Threads" is missing for QRF Channel',
          interaction
        )
        return
      }
      if (!botPermissions.has('ManageThreads')) {
        await informativeError(
          'Role permission "Manage Threads" is missing for QRF Channel',
          interaction
        )
        return
      }
      if (!botPermissions.has('SendMessages')) {
        await informativeError(
          'Role permission "Send Messages" is missing for QRF Channel',
          interaction
        )
        return
      }
      if (!botPermissions.has('SendMessagesInThreads')) {
        await informativeError(
          'Role permission "Send Messages In Threads" is missing for QRF Channel',
          interaction
        )
        return
      }
      if (!botPermissions.has('EmbedLinks')) {
        await informativeError(
          'Role permission "Embed Links" is missing for QRF Channel',
          interaction
        )
        return
      }
      if (!botPermissions.has('ReadMessageHistory')) {
        await informativeError(
          'Role permission "Read Message History" is missing for QRF Channel',
          interaction
        )
        return
      }
      if (!Object.hasOwn(this.regionFriendlyNames, region)) {
        await informativeError(`"${region}" is not a location in Foxhole`, interaction)
        return
      }
      if (image === null) {
        await informativeError(`Could not find the attachment image`, interaction)
        return
      }

      const qrfEmbed = new EmbedBuilder()
        .setAuthor({ name: interaction.user.tag, iconURL: userAvatar })
        .setTitle(`Help ${this.regionFriendlyNames[region]}!`)
        .setDescription(description)
        .setImage(image.url)
        .setColor('#245682')
        .setFields(
          { name: 'Status', value: '🔴 ONGOING', inline: true },
          { name: 'OP', value: interaction.user.toString(), inline: true },
          { name: 'Responders', value: interaction.user.toString(), inline: true }
        )
        .setTimestamp(Date.now())
        .setFooter({
          text: 'QRF Request',
          iconURL:
            'https://cdn.discordapp.com/attachments/1025869440451100742/1099895163662372875/rotating_light.png'
        })

      const submitButton = new ButtonBuilder() //
        .setCustomId('qrfSubmit')
        .setEmoji('📩')
        .setLabel('Submit')
        .setStyle(ButtonStyle.Success)

      const qrfMessage = await interaction.editReply({
        embeds: [qrfEmbed],
        components: createPartitionedMessageRow([submitButton])
      })

      qrfMessage
        .awaitMessageComponent({
          filter: () => true,
          componentType: ComponentType.Button,
          time: Time.Minute * 2
        })
        .then(async (buttonClick) => {
          const actualMessageEmbeds = buttonClick.message.embeds[0]

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
        })
        .catch((error) => {
          interaction.client.logger.error(error)
        })
        .finally(() => {
          interaction.deleteReply().catch((error: unknown) => {
            interaction.client.logger.error(error)
          })
        })
    } catch (error) {
      void errorMessage(error, interaction)
    }
  }
}

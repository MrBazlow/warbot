import { Command } from '@sapphire/framework'
import { createPartitionedMessageRow } from '@sapphire/discord.js-utilities'
import { EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import errorMessage from '../lib/errorMessage.js'
import { regionFriendlyNamesSchema } from '../schema.js'
import { Time } from '@sapphire/time-utilities'
import { Value } from '@sinclair/typebox/value'

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
    await interaction.deferReply()
    const userAvatar = interaction.user.avatarURL() ?? ''
    const region = interaction.options.getString('region') as keyof typeof this.regionFriendlyNames
    const description = interaction.options.getString('description') ?? ''
    const image = interaction.options.getAttachment('screenshot')

    try {
      if (!Object.hasOwn(this.regionFriendlyNames, region)) {
        await interaction.editReply(`"${region}" is not a location in Foxhole`)
        setTimeout(() => {
          void interaction.deleteReply().catch((error: unknown) => {
            interaction.client.logger.error(error)
          })
        }, Time.Second * 5)
        return
      }
      if (image === null) {
        throw new Error('Unable to find image')
      }
      if (interaction.channel?.isTextBased()) {
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
        const cancelButton = new ButtonBuilder() //
          .setCustomId('qrfCancel')
          .setEmoji('🛑')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)

        await interaction.editReply({
          embeds: [qrfEmbed],
          components: createPartitionedMessageRow([submitButton, cancelButton])
        })
      }
    } catch (error) {
      void errorMessage(error, interaction)
    }
  }
}

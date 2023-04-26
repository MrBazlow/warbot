import { Time } from '@sapphire/time-utilities'

import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction
} from 'discord.js'

export default async function informativeError(
  information: string,
  interaction: StringSelectMenuInteraction | ButtonInteraction | ChatInputCommandInteraction
) {
  await interaction
    .editReply({
      content: information
    })
    .catch((error: unknown) => {
      interaction.client.logger.error(error)
    })

  setTimeout(() => {
    void interaction.deleteReply().catch((error: unknown) => {
      interaction.client.logger.error(error)
    })
  }, Time.Second * 5)
}

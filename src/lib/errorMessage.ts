import { Time } from '@sapphire/time-utilities'
import language from '../language.js'

import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction
} from 'discord.js'

export default async function errorMessage(
  error: unknown,
  interaction: StringSelectMenuInteraction | ButtonInteraction | ChatInputCommandInteraction,
  userLang: keyof typeof language.strings = 'en'
) {
  interaction.client.logger.error(error)
  await interaction
    .editReply({
      content: language.strings[userLang].error
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

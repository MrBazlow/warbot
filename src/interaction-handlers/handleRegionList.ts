import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework'
import type { AutocompleteInteraction } from 'discord.js'
import { regionFriendlyNamesSchema } from '../schema.js'
import { Value } from '@sinclair/typebox/value'

export class AutocompleteHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Autocomplete
    })
  }

  public regionNames = Object.entries(Value.Create(regionFriendlyNamesSchema))

  public override async run(
    interaction: AutocompleteInteraction,
    result: InteractionHandler.ParseResult<this>
  ) {
    return interaction.respond(result)
  }

  public override parse(interaction: AutocompleteInteraction) {
    const regionCommands = ['shardresources', 'qrf']
    if (!regionCommands.includes(interaction.commandName)) {
      return this.none()
    }

    const focusedOption = interaction.options.getFocused(true)
    if (focusedOption.name === 'region') {
      if (focusedOption.value === '') {
        return this.some(
          this.regionNames.slice(0, 24).map((match) => {
            const [apiName, friendlyName] = match
            return { name: friendlyName, value: apiName }
          })
        )
      }
      const autoResult = this.regionNames.filter((word) =>
        word[1].toLowerCase().includes(focusedOption.value.toLowerCase())
      )
      return this.some(
        autoResult
          .slice(0, 24)
          .map((match) => ({ name: match[1].toString(), value: match[0].toString() }))
      )
    }
    return this.none()
  }
}

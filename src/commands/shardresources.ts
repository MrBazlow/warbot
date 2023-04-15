import {
  foxholeShardsSchema,
  foxholeRegionNameSchema,
  regionFriendlyNamesSchema
} from '../schema.js'
import { TextChannel, codeBlock } from 'discord.js'
import inspectRegion from '../lib/inspectRegion.js'
import getMapDynamic from '../lib/getMapDynamic.js'
import { Value } from '@sinclair/typebox/value'
import { Command } from '@sapphire/framework'
import { table } from 'table'

import type { Shards } from '../schema.js'
import type { TableUserConfig } from 'table'

export class UserEvent extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'shardresources',
      description: 'Returns resource fields in region'
    })
  }

  public cachedShardDetails = Value.Create(foxholeShardsSchema)
  public regionFriendlyNames = Value.Create(regionFriendlyNamesSchema)

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
            .setName('shard')
            .setDescription('Shard to check, default ABLE')
            .addChoices(
              ...(
                Object.keys(this.cachedShardDetails) as (keyof typeof this.cachedShardDetails)[]
              ).map((shard) => ({
                name: this.cachedShardDetails[shard].toUpperCase(),
                value: shard
              }))
            )
        )
    })
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (interaction.channel instanceof TextChannel) {
      interaction.client.logger.info(
        `${interaction.user.tag} in #${interaction.channel.name} called shardresources.`
      )
    }

    await interaction.deferReply()

    const shardInput: Shards =
      (interaction.options.getString('shard') as Shards | null) ??
      (Object.keys(this.cachedShardDetails)[0] as Shards[][0])

    const regionInput = interaction.options.getString('region')

    if (regionInput === null) {
      await interaction.editReply({
        content: `No region? That's not how this works, that's not how any of this works! 😠`
      })
      setTimeout(() => {
        void interaction.deleteReply()
      }, 2_000)
      return
    }

    if (!Value.Check(foxholeRegionNameSchema, regionInput)) {
      await interaction.editReply({
        content: `${
          interaction.member?.user.username ?? 'Gretchen'
        }, stop trying to make ‘${regionInput}’ happen! It’s not going to happen!`
      })
      setTimeout(() => {
        void interaction.deleteReply()
      }, 5_000)
      return
    }

    const tableConfig: TableUserConfig = {
      spanningCells: [{ col: 0, row: 0, colSpan: 2, alignment: 'center' }]
    }

    const tableData = [
      [`${this.regionFriendlyNames[regionInput]}`, ''],
      ['Resources', 'Count']
    ]

    const regionReport = await getMapDynamic(this.cachedShardDetails[shardInput], regionInput).then(
      (report) => inspectRegion(report)
    )
    Object.entries(regionReport).forEach((entry) => {
      const [title, count] = entry
      if (count !== 0) {
        tableData.push([title, count.toString()])
      }
    })

    const tableBlock = codeBlock(table(tableData, tableConfig))

    await interaction.editReply({ content: tableBlock })
    setTimeout(() => {
      void interaction.deleteReply().then(console.log).catch(console.error)
    }, 10_000)
  }
}

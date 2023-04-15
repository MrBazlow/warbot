import { TextChannel, codeBlock } from 'discord.js'
import inspectRegion from '../lib/inspectRegion.js'
import getMapDynamic from '../lib/getMapDynamic.js'
import { Value } from '@sinclair/typebox/value'
import { TableUserConfig, table } from 'table'
import { Command } from '@sapphire/framework'
import {
  fieldObjectSchema,
  fieldsFriendlyNameSchema,
  foxholeShardsSchema,
  regionFriendlyNamesSchema,
  shardsRegionsBaseFieldSchema
} from '../schema.js'

import type { FieldFriendlyName, Shards, FoxholeRegionName } from '../schema.js'

export class UserEvent extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'shardregionwithmost',
      description: 'Returns regions with most resource nodes of requested type'
    })
  }

  public cachedShardDetails = Value.Create(foxholeShardsSchema)
  public regionFriendlyNames = Value.Create(regionFriendlyNamesSchema)
  public cachedResourceFields = Value.Create(shardsRegionsBaseFieldSchema)

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option //
            .setName('resource')
            .setDescription('Resource to check')
            .addChoices(
              ...(Object.keys(Value.Create(fieldObjectSchema)) as FieldFriendlyName[]).map(
                (resource) => ({
                  name: resource,
                  value: resource
                })
              )
            )
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

    const resourceInput = interaction.options.getString('resource')

    if (resourceInput === null || !Value.Check(fieldsFriendlyNameSchema, resourceInput)) {
      await interaction.editReply({
        content: `😠`
      })
      setTimeout(() => {
        void interaction.deleteReply()
      }, 2_000)
      return
    }

    const tableConfig: TableUserConfig = {
      spanningCells: [{ col: 0, row: 0, colSpan: 2, alignment: 'center' }]
    }

    const tableData = [
      [`${resourceInput}`, ''],
      ['Region', 'Count']
    ]

    const shardAPI = this.cachedShardDetails[shardInput]
    const regionsToCheck = Object.keys(this.cachedResourceFields[shardInput]) as FoxholeRegionName[]

    await Promise.allSettled(
      regionsToCheck.map(async (region) => {
        await getMapDynamic(shardAPI, region).then((response) => {
          this.cachedResourceFields[shardInput][region] = inspectRegion(response)
        })
      })
    )

    const valuesArray: [(typeof this.regionFriendlyNames)[FoxholeRegionName], number][] = []
    regionsToCheck.forEach((region) => {
      valuesArray.push([
        this.regionFriendlyNames[region],
        this.cachedResourceFields[shardInput][region][resourceInput]
      ])
    })
    valuesArray.sort((a, b) => b[1] - a[1])
    valuesArray.slice(0, 9).forEach((entry) => {
      const [regionName, amount] = entry
      if (amount !== 0) {
        tableData.push([regionName, amount.toString()])
      }
    })

    const tableBlock = codeBlock(table(tableData, tableConfig))

    await interaction.editReply({ content: tableBlock })
    setTimeout(() => {
      void interaction.deleteReply().then(console.log).catch(console.error)
    }, 10_000)
  }
}

import { TextChannel, codeBlock } from 'discord.js'
import { Value } from '@sinclair/typebox/value'
import { Command } from '@sapphire/framework'
import fetchJSON from '../lib/fetchJson.js'
import addCommas from '../lib/addCommas.js'
import { table } from 'table'
import {
  foxholeHomeRegionSchema,
  foxholeShardsSchema,
  shardEnlistmentsSchema,
  shardNamesSchema,
  warReportSchema
} from '../schema.js'

import type { Shards, FoxholeShards } from '../schema.js'
import type { TableUserConfig } from 'table'

export class UserCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'shardenlistments',
      description: 'Return current Enlistments'
    })
  }

  public cachedShardDetails = Value.Create(foxholeShardsSchema)

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option //
            .setName('shard')
            .setDescription('Get a specific shards Enlistments')
            .addChoices(
              ...(Object.keys(this.cachedShardDetails) as Shards[]).map((shard) => ({
                name: this.cachedShardDetails[shard].toUpperCase(),
                value: shard
              }))
            )
        )
    })
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    interaction.client.logger.info(
      `${interaction.user.tag} in #${
        interaction.channel instanceof TextChannel ? interaction.channel.name : 'somewhere'
      } called shardenlistments.`
    )

    await interaction.deferReply()

    const shardInput = interaction.options.getString('shard')
    const arrayShards: Shards[] = []
    if (shardInput === null) {
      arrayShards.push(...(Object.keys(this.cachedShardDetails) as Shards[]))
    } else {
      arrayShards.push(
        Value.Check(shardNamesSchema, shardInput)
          ? shardInput
          : (Object.keys(this.cachedShardDetails)[0] as Shards[][0])
      )
    }

    const tally = Value.Create(shardEnlistmentsSchema)

    const getHomeEnlistments = async (shardAPI: FoxholeShards[Shards]) => {
      const count = {
        colonial: 0,
        warden: 0,
        total: 0
      }

      const homeRegionNames = foxholeHomeRegionSchema.anyOf.map((region) => region.const)

      const homeRegionData = homeRegionNames.map((homeName) => {
        return fetchJSON(`${shardAPI}worldconquest/warReport/${homeName}`)
      })

      const [colonialHome, wardenHome] = await Promise.allSettled(homeRegionData)
      if (colonialHome.status === 'fulfilled' && Value.Check(warReportSchema, colonialHome.value)) {
        count.colonial = colonialHome.value.totalEnlistments
      }
      if (wardenHome.status === 'fulfilled' && Value.Check(warReportSchema, wardenHome.value)) {
        count.warden = wardenHome.value.totalEnlistments
      }
      count.total = count.colonial + count.warden

      return {
        Colonial: addCommas(count.colonial.toString()),
        Warden: addCommas(count.warden.toString()),
        Total: addCommas(count.total.toString())
      }
    }

    const allRequests = arrayShards.map(async (shard) => {
      const shardAPI = this.cachedShardDetails[shard]
      try {
        const shardHomeEnlistments = await getHomeEnlistments(shardAPI)
        tally[shard] = shardHomeEnlistments
      } catch (error) {
        tally[shard] = {
          Colonial: '0',
          Warden: '0',
          Total: '0'
        }
        console.error(error)
      }
    })
    await Promise.allSettled(allRequests)

    const tableConfig: TableUserConfig = {
      spanningCells: [{ col: 0, row: 0, colSpan: 4, alignment: 'center' }]
    }

    const tableData = [
      ['Not a gauge of activity!', '', '', ''],
      ['Shard', 'Colonial', 'Warden', 'Total']
    ]
    arrayShards.forEach((shard) => {
      tableData.push([
        shard.toUpperCase(),
        tally[shard].Colonial,
        tally[shard].Warden,
        tally[shard].Total
      ])
    })

    const tableBlock = codeBlock(table(tableData, tableConfig))

    await interaction.editReply({ content: tableBlock })
    setTimeout(() => {
      void interaction.deleteReply().then(console.log).catch(console.error)
    }, 10_000)
  }
}

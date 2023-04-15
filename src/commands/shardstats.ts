import { TextChannel, codeBlock } from 'discord.js'
import { Value } from '@sinclair/typebox/value'
import { Command } from '@sapphire/framework'
import fetchJSON from '../lib/fetchJson.js'
import addCommas from '../lib/addCommas.js'
import getMaps from '../lib/getMaps.js'
import { table } from 'table'
import {
  foxholeShardsSchema,
  warReportSchema,
  shardWarStatSchema,
  shardNamesSchema
} from '../schema.js'

import type { Shards, FoxholeShards, WarStat, ArrayOfFoxholeRegions } from '../schema.js'

export class UserEvent extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'shardstats',
      description: 'Returns stats'
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
            .setDescription('Get a specific shards stats')
            .addChoices(
              ...(Object.keys(this.cachedShardDetails) as Shards[]).map((shard) => ({
                name: shard.toUpperCase(),
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
      } called shardstats.`
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

    const tally = Value.Create(shardWarStatSchema)

    async function getWarReport(
      api: FoxholeShards[Shards],
      serverMaps: ArrayOfFoxholeRegions
    ): Promise<WarStat> {
      const count = {
        colonial: 0,
        warden: 0,
        total: 0,
        day: 0
      }
      const daysOfWarCollection = [0]

      const mapReports = serverMaps.map((foxholeRegion) =>
        fetchJSON(`${api}worldconquest/warReport/${foxholeRegion}`)
      )
      const results = (await Promise.allSettled(mapReports)).map((report) => {
        if (report.status === 'rejected') {
          return Value.Create(warReportSchema)
        }
        return Value.Check(warReportSchema, report.value)
          ? report.value
          : Value.Create(warReportSchema)
      })
      results.map((regionReport) => {
        count.colonial += regionReport.colonialCasualties
        count.warden += regionReport.wardenCasualties
        daysOfWarCollection.push(regionReport.dayOfWar)
      })

      count.total = count.colonial + count.warden
      count.day = Math.max(...daysOfWarCollection)

      return {
        Colonials: addCommas(count.colonial.toString()),
        Wardens: addCommas(count.warden.toString()),
        Total: addCommas(count.total.toString()),
        Day: addCommas(count.day.toString())
      }
    }

    const allRequests = arrayShards.map(async (shard) => {
      const shardAPI = this.cachedShardDetails[shard]
      try {
        const mapList = await getMaps(shardAPI)
        const shardWarReport = await getWarReport(shardAPI, mapList)
        tally[shard] = shardWarReport
      } catch (error) {
        console.error(error)
      }
    })
    await Promise.allSettled(allRequests)

    const tableData = [['Shard', 'Colonials', 'Wardens', 'Total', 'Day']]
    arrayShards.forEach((shard) => {
      tableData.push([
        shard,
        tally[shard].Colonials,
        tally[shard].Wardens,
        tally[shard].Total,
        tally[shard].Day
      ])
    })

    const tableBlock = codeBlock(table(tableData))

    await interaction.editReply({ content: tableBlock })
    setTimeout(() => {
      void interaction.deleteReply().then(console.log).catch(console.error)
    }, 10_000)
  }
}

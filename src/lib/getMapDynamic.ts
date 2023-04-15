import { Value } from '@sinclair/typebox/value'
import { dynamicMapSchema } from '../schema.js'
import fetchJSON from './fetchJson.js'

import type { FoxholeShards, Shards, FoxholeRegionName, DynamicMap } from '../schema.js'

export default async function getMapDynamic(
  api: FoxholeShards[Shards],
  region: FoxholeRegionName
): Promise<DynamicMap> {
  const request = await fetchJSON(`${api}worldconquest/maps/${region}/dynamic/public`)
  return Value.Check(dynamicMapSchema, request) ? request : Value.Create(dynamicMapSchema)
}

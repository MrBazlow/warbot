import { arrayOfFoxholeRegionsSchema } from '../schema.js'
import { Value } from '@sinclair/typebox/value'
import fetchJSON from './fetchJson.js'

import type { FoxholeShards, Shards, ArrayOfFoxholeRegions } from 'schema.js'

export default async function getMaps(api: FoxholeShards[Shards]): Promise<ArrayOfFoxholeRegions> {
  const request = await fetchJSON(`${api}worldconquest/maps`)
  return Value.Check(arrayOfFoxholeRegionsSchema, request) ? request : []
}

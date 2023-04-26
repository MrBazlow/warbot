import path from 'path'
import fs from 'fs/promises'
import { Type, Static } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

// https://war-service-live.foxholeservices.com/api/worldconquest/maps
// https://war-service-live.foxholeservices.com/api/worldconquest/maps/{{REGION}}/static

const regionJson = path.resolve('./src/util/major.json')

const allMajorLabelsAndRegions: Record<RegionArray[number], Record<string, string>> = {}

const regionArraySchema = Type.Array(Type.String({ default: '' }))

type RegionArray = Static<typeof regionArraySchema>

const mapTextItemsSchema = Type.Object({
  text: Type.String({ default: '' }),
  x: Type.Number({ default: 0 }),
  y: Type.Number({ default: 0 }),
  mapMarkerType: Type.Union([Type.Literal('Minor'), Type.Literal('Major')])
})

const mapStaticSchema = Type.Object({
  regionId: Type.Number({ default: 0 }),
  scorchedVictoryTowns: Type.Number({ default: 0 }),
  mapItems: Type.Array(Type.Never()),
  mapItemsC: Type.Array(Type.Never()),
  mapItemsW: Type.Array(Type.Never()),
  mapTextItems: Type.Array(mapTextItemsSchema),
  lastUpdated: Type.Number({ default: 0 }),
  version: Type.Number({ default: 0 })
})

const regions: RegionArray | null = await fetch(
  'https://war-service-live.foxholeservices.com/api/worldconquest/maps'
).then(async (response) => {
  if (response.body !== null) {
    const returnValue = (await response.json()) as unknown
    return Value.Check(regionArraySchema, returnValue) ? returnValue : null
  }
  return null
})

if (regions === null) {
  process.exit(1)
}

regions.forEach((region) => {
  allMajorLabelsAndRegions[region] = {}
})

const allRequests = regions.map(async (region) => {
  await fetch(
    `https://war-service-live.foxholeservices.com/api/worldconquest/maps/${region}/static`
  ).then(async (response) => {
    if (response.body !== null) {
      const values = (await response.json()) as unknown
      if (Value.Check(mapStaticSchema, values)) {
        const majorFeatures = values.mapTextItems.filter((entry) => {
          return entry.mapMarkerType === 'Major'
        })
        majorFeatures.forEach((entry) => {
          if (region in allMajorLabelsAndRegions)
            allMajorLabelsAndRegions[region][entry.text] = entry.text
        })
      }
    }
  })
})

await Promise.allSettled(allRequests)

await fs.writeFile(regionJson, JSON.stringify(allMajorLabelsAndRegions))

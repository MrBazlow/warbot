import { Static, Type } from '@sinclair/typebox'

export const foxholeShardsSchema = Type.Object({
  able: Type.Literal('https://war-service-live.foxholeservices.com/api/')
})

export type FoxholeShards = Static<typeof foxholeShardsSchema>

export const shardNamesSchema = Type.KeyOf(foxholeShardsSchema)

export type Shards = Static<typeof shardNamesSchema>

export const regionFriendlyNamesSchema = Type.Object({
  AcrithiaHex: Type.Literal('Acrithia'),
  AllodsBightHex: Type.Literal('Allods Bight'),
  AshFieldsHex: Type.Literal('Ash Fields'),
  BasinSionnachHex: Type.Literal('Basin Sionnach'),
  CallahansPassageHex: Type.Literal('Callahans Passage'),
  CallumsCapeHex: Type.Literal('Callums Cape'),
  ClansheadValleyHex: Type.Literal('Clanshead Valley'),
  DeadLandsHex: Type.Literal('Deadlands'),
  DrownedValeHex: Type.Literal('The Drowned Vale'),
  EndlessShoreHex: Type.Literal('Endless Shore'),
  FarranacCoastHex: Type.Literal('Farranac Coast'),
  FishermansRowHex: Type.Literal('Fishermans Row'),
  GodcroftsHex: Type.Literal('Godcrofts'),
  GreatMarchHex: Type.Literal('Great March'),
  HeartlandsHex: Type.Literal('The Heartlands'),
  HowlCountyHex: Type.Literal('Howl County'),
  KalokaiHex: Type.Literal('Kalokai'),
  LinnMercyHex: Type.Literal('The Linn of Mercy'),
  LochMorHex: Type.Literal('Loch Mor'),
  MarbanHollow: Type.Literal('Marban Hollow'),
  MooringCountyHex: Type.Literal('The Moors'),
  MorgensCrossingHex: Type.Literal('Morgens Crossing'),
  NevishLineHex: Type.Literal('Nevish Line'),
  OarbreakerHex: Type.Literal('The Oarbreaker Isles'),
  OriginHex: Type.Literal('Origin'),
  ReachingTrailHex: Type.Literal('Reaching Trail'),
  RedRiverHex: Type.Literal('Red River'),
  ShackledChasmHex: Type.Literal('Shackled Chasm'),
  SpeakingWoodsHex: Type.Literal('Speaking Woods'),
  StonecradleHex: Type.Literal('Stonecradle'),
  TempestIslandHex: Type.Literal('Tempest Island'),
  TerminusHex: Type.Literal('Terminus'),
  TheFingersHex: Type.Literal('The Fingers'),
  UmbralWildwoodHex: Type.Literal('Umbral Wildwood'),
  ViperPitHex: Type.Literal('Viper Pit'),
  WeatheredExpanseHex: Type.Literal('Weathered Expanse'),
  WestgateHex: Type.Literal('Westgate')
})

export type RegionFriendlyNames = Static<typeof regionFriendlyNamesSchema>

export const foxholeRegionNameSchema = Type.KeyOf(regionFriendlyNamesSchema, {
  default: 'AcrithiaHex'
})

export type FoxholeRegionName = Static<typeof foxholeRegionNameSchema>

export const arrayOfFoxholeRegionsSchema = Type.Array(foxholeRegionNameSchema)

export type ArrayOfFoxholeRegions = Static<typeof arrayOfFoxholeRegionsSchema>

export const foxholeHomeRegionSchema = Type.Union(
  [Type.Literal('HomeRegionC'), Type.Literal('HomeRegionW')],
  {
    default: 'HomeRegionW'
  }
)

export type FoxholeHomeRegion = Static<typeof foxholeHomeRegionSchema>

export const enlistmentsSchema = Type.Object({
  Colonial: Type.String({ default: '0' }),
  Warden: Type.String({ default: '0' }),
  Total: Type.String({ default: '0' })
})

export type Enlistments = Static<typeof enlistmentsSchema>

export const shardEnlistmentsSchema = Type.Record(shardNamesSchema, enlistmentsSchema)

export type ShardEnlistments = Static<typeof shardEnlistmentsSchema>

export const warReportSchema = Type.Object({
  totalEnlistments: Type.Number({ default: 0 }),
  colonialCasualties: Type.Number({ default: 0 }),
  wardenCasualties: Type.Number({ default: 0 }),
  dayOfWar: Type.Number({ default: 0 }),
  version: Type.Number({ default: 0 })
})

export type WarReport = Static<typeof warReportSchema>

export const warStatSchema = Type.Object({
  Colonials: Type.String({ default: '0' }),
  Wardens: Type.String({ default: '0' }),
  Total: Type.String({ default: '0' }),
  Day: Type.String({ default: '0' })
})

export type WarStat = Static<typeof warStatSchema>

export const shardWarStatSchema = Type.Record(shardNamesSchema, warStatSchema)

export type ShardWarStatObject = Static<typeof shardWarStatSchema>

export const homeRegionsReportsSchema = Type.Record(foxholeHomeRegionSchema, warReportSchema)

export type HomeRegionReports = Static<typeof homeRegionsReportsSchema>

export const shardHomeRegionsReportsSchema = Type.Record(shardNamesSchema, homeRegionsReportsSchema)

export type ShardHomeRegionReports = Static<typeof shardHomeRegionsReportsSchema>

export const regionWarReportsSchema = Type.Record(foxholeRegionNameSchema, warReportSchema)

export type RegionWarReports = Static<typeof regionWarReportsSchema>

export const shardRegionWarReportsSchema = Type.Record(shardNamesSchema, regionWarReportsSchema)

export type ShardRegionWarReports = Static<typeof shardRegionWarReportsSchema>

export const dynamicMapItemSchema = Type.Object({
  teamId: Type.Union([Type.Literal('NONE'), Type.Literal('COLONIALS'), Type.Literal('WARDENS')], {
    default: 'NONE'
  }),
  iconType: Type.Number({ default: 0 }),
  x: Type.Number({ default: 0 }),
  y: Type.Number({ default: 0 }),
  flags: Type.Number({ default: 0 })
})

export type DynamicMapItem = Static<typeof dynamicMapItemSchema>

export const dynamicMapSchema = Type.Object({
  regionId: Type.Number({ default: 0 }),
  scorchedVictoryTowns: Type.Number({ default: 0 }),
  mapItems: Type.Array(dynamicMapItemSchema, { default: [] }),
  mapItemsC: Type.Array(Type.Object({})),
  mapItemsW: Type.Array(Type.Object({})),
  mapTextItems: Type.Array(Type.Object({})),
  lastUpdated: Type.Number({ default: 0 }),
  version: Type.Number({ default: 0 })
})

export type DynamicMap = Static<typeof dynamicMapSchema>

export const regionsDynamicMapSchema = Type.Record(foxholeRegionNameSchema, dynamicMapSchema)

export type RegionsDynamicMap = Static<typeof regionsDynamicMapSchema>

export const shardsRegionsDynamicMapSchema = Type.Record(shardNamesSchema, regionsDynamicMapSchema)

export type ShardsRegionsDynamicMap = Static<typeof shardsRegionsDynamicMapSchema>

export const fieldsApiValuesSchema = Type.Object({
  'Salvage Field': Type.Number({ default: 20 }),
  'Salvage Mine': Type.Number({ default: 38 }),
  'Component Field': Type.Number({ default: 21 }),
  'Component Mine': Type.Number({ default: 40 }),
  'Sulfur Field': Type.Number({ default: 23 }),
  'Sulfur Mine': Type.Number({ default: 32 }),
  'Coal Field': Type.Number({ default: 61 }),
  'Oil Field': Type.Number({ default: 62 })
})

export type FieldApiValues = Static<typeof fieldsApiValuesSchema>

export const fieldsFriendlyNameSchema = Type.KeyOf(fieldsApiValuesSchema, {
  default: 'Salvage Field'
})

export type FieldFriendlyName = Static<typeof fieldsFriendlyNameSchema>

export const fieldObjectSchema = Type.Object({
  'Salvage Field': Type.Number({ default: 0 }),
  'Salvage Mine': Type.Number({ default: 0 }),
  'Component Field': Type.Number({ default: 0 }),
  'Component Mine': Type.Number({ default: 0 }),
  'Sulfur Field': Type.Number({ default: 0 }),
  'Sulfur Mine': Type.Number({ default: 0 }),
  'Coal Field': Type.Number({ default: 0 }),
  'Oil Field': Type.Number({ default: 0 })
})

export type FieldObject = Static<typeof fieldObjectSchema>

export const regionsFieldObjectSchema = Type.Record(foxholeRegionNameSchema, fieldObjectSchema)

export type RegionFieldObjects = Static<typeof regionsFieldObjectSchema>

export const shardsRegionsBaseFieldSchema = Type.Record(shardNamesSchema, regionsFieldObjectSchema)

export type ShardRegionFieldObjects = Static<typeof shardsRegionsBaseFieldSchema>

import { fieldObjectSchema, fieldsApiValuesSchema } from '../schema.js'
import { Value } from '@sinclair/typebox/value'

import type { DynamicMap, FieldObject } from '../schema.js'

export default function inspectRegion(report: DynamicMap): FieldObject {
  const { mapItems } = report
  const lookupMap = new Map<number, string>()
  Object.entries(Value.Create(fieldsApiValuesSchema)).forEach((entry) => {
    const [key, value] = entry
    lookupMap.set(value, key)
  })
  const onlyResources = mapItems.filter((mapObject) => lookupMap.has(mapObject.iconType))
  const scoreObject = Value.Create(fieldObjectSchema)
  onlyResources.forEach((field) => {
    const entryName = lookupMap.get(field.iconType) as keyof typeof scoreObject | undefined
    if (entryName !== undefined) {
      scoreObject[entryName] += 1
    }
  })
  return scoreObject
}

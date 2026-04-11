import { describe, it } from 'vitest'
import * as fc from 'fast-check'

describe('fast-check integration', () => {
  it('should run property-based tests', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a // commutative property
      })
    )
  })
})

import assert from 'node:assert/strict'
import {
  allowedServiceCaseTransitions,
  assertServiceCaseTransition,
  canTransitionServiceCase,
  InvalidServiceCaseTransition,
} from '../lib/service-coordination/state-machine'
import {
  assertActiveAuthorization,
  authorizationScopeMatches,
  hashAuthorizationScope,
} from '../lib/service-coordination/authorization'
import { validateFoundingProviderSeed } from '../lib/service-coordination/founding-providers'
import { buildServiceAuthorization } from '../lib/service-coordination/commands'
import { evaluateServiceSafety } from '../lib/service-coordination/safety'

assert.equal(canTransitionServiceCase('draft', 'safety_screened'), true)
assert.equal(canTransitionServiceCase('draft', 'confirmed'), false)
assert.deepEqual(allowedServiceCaseTransitions('recorded'), [])
assert.doesNotThrow(() => assertServiceCaseTransition('booking_pending', 'confirmed'))
assert.throws(
  () => assertServiceCaseTransition('draft', 'confirmed'),
  InvalidServiceCaseTransition,
)

const scope = {
  providerId: 'provider-1',
  offerId: 'offer-1',
  fees: { diagnostic: 119, currency: 'USD' },
  window: { start: '2026-07-17T15:00:00Z', end: '2026-07-17T17:00:00Z' },
}
const sameScopeDifferentOrder = {
  window: { end: '2026-07-17T17:00:00Z', start: '2026-07-17T15:00:00Z' },
  fees: { currency: 'USD', diagnostic: 119 },
  offerId: 'offer-1',
  providerId: 'provider-1',
}
const hash = hashAuthorizationScope(scope)
assert.equal(hash, hashAuthorizationScope(sameScopeDifferentOrder))
assert.equal(authorizationScopeMatches(hash, scope), true)
assert.equal(authorizationScopeMatches(hash, { ...scope, providerId: 'provider-2' }), false)

assert.doesNotThrow(() =>
  assertActiveAuthorization(
    {
      kind: 'book_appointment',
      scope,
      scopeHash: hash,
      status: 'active',
      expiresAt: '2026-07-17T18:00:00Z',
    },
    sameScopeDifferentOrder,
    new Date('2026-07-17T16:00:00Z'),
  ),
)
assert.throws(() =>
  assertActiveAuthorization(
    {
      kind: 'book_appointment',
      scope,
      scopeHash: hash,
      status: 'active',
      expiresAt: '2026-07-17T15:00:00Z',
    },
    scope,
    new Date('2026-07-17T16:00:00Z'),
  ),
)

assert.deepEqual(evaluateServiceSafety({}), {
  stopped: false,
  triggered: [],
  guidance: 'No immediate stop condition was reported. Continue only with steps you are comfortable performing, and stop if conditions change.',
})
assert.equal(evaluateServiceSafety({ gasSmell: true }).stopped, true)
assert.deepEqual(
  evaluateServiceSafety({ smokeOrSparks: true, electricShock: true }).triggered,
  ['smokeOrSparks', 'electricShock'],
)

const builtAuthorization = buildServiceAuthorization({
  homeId: 'home-1',
  caseId: 'case-1',
  userId: 'user-1',
  kind: 'book_appointment',
  scope,
  expiresAt: new Date(Date.now() + 60_000),
})
assert.equal(builtAuthorization.scope_hash, hash)
assert.throws(() =>
  buildServiceAuthorization({
    homeId: 'home-1',
    caseId: 'case-1',
    userId: 'user-1',
    kind: 'book_appointment',
    scope,
    expiresAt: new Date(Date.now() - 1),
  }),
)

assert.deepEqual(
  validateFoundingProviderSeed({
    legalName: '',
    displayName: '',
    phone: '',
    pilotMarket: 'twin_cities',
    services: [],
    brands: [],
    zipCodes: [],
    bookingModes: [],
  }),
  [
    'legalName is required',
    'displayName is required',
    'phone is required',
    'services must include appliance_repair',
    'at least one service ZIP code is required',
    'at least one booking mode is required',
  ],
)

console.log('service coordination foundation checks passed')

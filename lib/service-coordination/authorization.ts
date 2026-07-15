import { createHash, timingSafeEqual } from 'node:crypto'

export const SERVICE_AUTHORIZATION_KINDS = [
  'share_request',
  'book_appointment',
  'reschedule',
  'cancel',
] as const

export type ServiceAuthorizationKind = (typeof SERVICE_AUTHORIZATION_KINDS)[number]
export type ServiceAuthorizationStatus = 'active' | 'consumed' | 'revoked' | 'expired'

export type ServiceAuthorization = {
  kind: ServiceAuthorizationKind
  scope: Record<string, unknown>
  scopeHash: string
  status: ServiceAuthorizationStatus
  expiresAt: string
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  const object = value as Record<string, unknown>
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`)
    .join(',')}}`
}

export function hashAuthorizationScope(scope: Record<string, unknown>): string {
  return createHash('sha256').update(canonicalize(scope)).digest('hex')
}

export function authorizationScopeMatches(
  expectedHash: string,
  scope: Record<string, unknown>,
): boolean {
  const actualHash = hashAuthorizationScope(scope)
  const expected = Buffer.from(expectedHash, 'hex')
  const actual = Buffer.from(actualHash, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function assertActiveAuthorization(
  authorization: ServiceAuthorization,
  exactScope: Record<string, unknown>,
  now = new Date(),
): void {
  if (authorization.status !== 'active') {
    throw new Error(`Service authorization is ${authorization.status}.`)
  }
  if (new Date(authorization.expiresAt).getTime() <= now.getTime()) {
    throw new Error('Service authorization has expired.')
  }
  if (!authorizationScopeMatches(authorization.scopeHash, exactScope)) {
    throw new Error('Service authorization does not match the current terms.')
  }
}


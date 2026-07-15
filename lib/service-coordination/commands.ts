import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/database.types'
import {
  assertServiceCaseTransition,
  type ServiceCaseStatus,
} from '@/lib/service-coordination/state-machine'
import {
  assertActiveAuthorization,
  hashAuthorizationScope,
  type ServiceAuthorizationKind,
} from '@/lib/service-coordination/authorization'

type Client = SupabaseClient<Database>
type ActorType = 'homeowner' | 'agent' | 'operator' | 'provider' | 'system'
type ServiceCase = Database['public']['Tables']['service_cases']['Row']
type Authorization = Database['public']['Tables']['service_authorizations']['Row']

export type TransitionServiceCaseInput = {
  caseId: string
  expectedStatus: ServiceCaseStatus
  nextStatus: ServiceCaseStatus
  actorType: ActorType
  actorId?: string
  reason?: string
  metadata?: Record<string, unknown>
  authorizationId?: string
  idempotencyKey: string
}

/**
 * Atomic state transition. The supplied client must be a service-role client
 * created only inside a gated /admin route or an authorized server process.
 * The database independently enforces the same transition graph.
 */
export async function transitionServiceCase(
  client: Client,
  input: TransitionServiceCaseInput,
): Promise<ServiceCase> {
  assertServiceCaseTransition(input.expectedStatus, input.nextStatus)
  const { data, error } = await client.rpc('transition_service_case', {
    p_case_id: input.caseId,
    p_expected_status: input.expectedStatus,
    p_next_status: input.nextStatus,
    p_actor_type: input.actorType,
    p_actor_id: input.actorId,
    p_reason: input.reason,
    p_metadata: (input.metadata ?? {}) as Json,
    p_authorization_id: input.authorizationId,
    p_idempotency_key: input.idempotencyKey,
  })
  if (error) throw new Error(`Could not transition service case: ${error.message}`)
  return data
}

export type BuildAuthorizationInput = {
  homeId: string
  caseId: string
  userId: string
  kind: ServiceAuthorizationKind
  scope: Record<string, unknown>
  expiresAt: Date
}

export function buildServiceAuthorization(input: BuildAuthorizationInput) {
  if (input.expiresAt.getTime() <= Date.now()) {
    throw new Error('Service authorization expiration must be in the future.')
  }
  return {
    home_id: input.homeId,
    service_case_id: input.caseId,
    user_id: input.userId,
    kind: input.kind,
    scope: input.scope as Json,
    scope_hash: hashAuthorizationScope(input.scope),
    expires_at: input.expiresAt.toISOString(),
  } satisfies Database['public']['Tables']['service_authorizations']['Insert']
}

/**
 * Consume an exact authorization once. Local validation produces a useful
 * error; the locked database RPC is the authoritative race-safe check.
 */
export async function consumeServiceAuthorization(
  client: Client,
  authorization: Authorization,
  exactScope: Record<string, unknown>,
): Promise<Authorization> {
  assertActiveAuthorization(
    {
      kind: authorization.kind as ServiceAuthorizationKind,
      scope: authorization.scope as Record<string, unknown>,
      scopeHash: authorization.scope_hash,
      status: authorization.status as 'active' | 'consumed' | 'revoked' | 'expired',
      expiresAt: authorization.expires_at,
    },
    exactScope,
  )
  const { data, error } = await client.rpc('consume_service_authorization', {
    p_authorization_id: authorization.id,
    p_scope_hash: hashAuthorizationScope(exactScope),
  })
  if (error) throw new Error(`Could not consume service authorization: ${error.message}`)
  return data
}


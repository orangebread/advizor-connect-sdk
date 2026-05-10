import type { paths, components } from './generated/v1.js';
import type { FetchLike, RequestInput, SdkRequester } from './core.js';
import { createBearerAuthHeaderProvider, createSdkRequester } from './core.js';
import { operationMetadata, type SdkMethodName } from './operations.js';
import { assertApiKeyClientAllowedInRuntime, type UnsafeBrowserApiKeyOverride } from './runtime.js';

export type V1ClientOptions = UnsafeBrowserApiKeyOverride & {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

// Re-export generated schema types for consumer convenience
export type ApiKeyRecord = components['schemas']['ApiKeyRecord'];
export type InviteRecord = components['schemas']['InviteRecord'];
export type GroupSettingsResponse = components['schemas']['GroupSettingsResponse'];
export type WidgetConfigResponse = components['schemas']['WidgetConfigResponse'];
export type WidgetAdvisor = components['schemas']['WidgetAdvisor'];
export type WidgetSecurityConfig = components['schemas']['WidgetSecurityConfig'];
export type IntegrationAdvisor = components['schemas']['IntegrationAdvisor'];
export type IntegrationAdvisorFeedResponse = components['schemas']['IntegrationAdvisorFeedResponse'];
export type SessionEnvelope = components['schemas']['SessionEnvelope'];
export type ApiSession = components['schemas']['ApiSession'];
export type LedgerEvent = components['schemas']['LedgerEvent'];
export type ErrorResponse = components['schemas']['ErrorResponse'];

// Path-level response helpers. Most SDK routes are JSON, but public SEO
// helpers intentionally return XML or JSON-LD.
type SuccessContent<P extends keyof paths, M extends keyof paths[P]> =
  paths[P][M] extends { responses: { 200: { content: infer C } } } ? C : never;

type SuccessJson<P extends keyof paths, M extends keyof paths[P]> =
  SuccessContent<P, M> extends { 'application/json': infer R } ? R :
  SuccessContent<P, M> extends { 'application/ld+json': infer R } ? R :
  SuccessContent<P, M> extends { 'application/xml': infer R } ? R :
  never;

type OperationRequestInput = Omit<RequestInput, 'operation'>;

function createOperationRequester(request: SdkRequester) {
  return function requestOperation<T>(methodName: SdkMethodName, input: OperationRequestInput) {
    return request<T>({
      ...input,
      operation: operationMetadata(methodName),
    });
  };
}

export function createV1MethodSet(request: SdkRequester) {
  const requestOperation = createOperationRequester(request);
  const e = encodeURIComponent;


  return {
    // ── Integration (2) ──────────────────────────────────────────────

    listGroupAdvisors(input: {
      groupId: string;
      sort?: 'billable_minutes_30d' | 'online_status' | 'alphabetical';
      order?: 'asc' | 'desc';
      onlineStatus?: 'online' | 'offline' | 'available' | 'busy';
      minBillableMinutes30d?: number;
    }) {
      return requestOperation<SuccessJson<'/v1/integration/groups/{groupId}/advisors', 'get'>>('listGroupAdvisors', {
        method: 'GET',
        path: `/v1/integration/groups/${e(input.groupId)}/advisors`,
        query: {
          sort: input.sort,
          order: input.order,
          onlineStatus: input.onlineStatus,
          minBillableMinutes30d: input.minBillableMinutes30d,
        },
      });
    },

    getGroupAdvisor(input: { groupId: string; advisorId: string }) {
      return requestOperation<SuccessJson<'/v1/integration/groups/{groupId}/advisors/{advisorId}', 'get'>>('getGroupAdvisor', {
        method: 'GET',
        path: `/v1/integration/groups/${e(input.groupId)}/advisors/${e(input.advisorId)}`,
      });
    },

    // ── Sessions (13) ────────────────────────────────────────────────

    createSession(input: {
      groupId: string;
      advisorId: string;
      callerPhone: string;
      idempotencyKey: string;
      callerUsername?: string;
      callerEmail?: string;
    }) {
      return requestOperation<SuccessJson<'/v1/sessions', 'post'>>('createSession', {
        method: 'POST',
        path: '/v1/sessions',
        body: input,
      });
    },

    getSession(input: { sessionId: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}', 'get'>>('getSession', {
        method: 'GET',
        path: `/v1/sessions/${e(input.sessionId)}`,
      });
    },

    getSessionLedger(input: { sessionId: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/ledger', 'get'>>('getSessionLedger', {
        method: 'GET',
        path: `/v1/sessions/${e(input.sessionId)}/ledger`,
      });
    },

    sendOtp(input: { sessionId: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/otp/send', 'post'>>('sendOtp', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/otp/send`,
      });
    },

    verifyPhone(input: { sessionId: string; otp: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/verify-phone', 'post'>>('verifyPhone', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/verify-phone`,
        body: { otp: input.otp },
      });
    },

    createStripeIntent(input: { sessionId: string; holdCents?: 2500 | 5000 }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/payments/create-intent', 'post'>>('createStripeIntent', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/payments/create-intent`,
        body: input.holdCents != null ? { holdCents: input.holdCents } : {},
      });
    },

    createPayPalOrder(input: { sessionId: string; holdCents?: 2500 | 5000 }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/payments/paypal/create-order', 'post'>>('createPayPalOrder', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/payments/paypal/create-order`,
        body: input.holdCents != null ? { holdCents: input.holdCents } : {},
      });
    },

    authorizePayPalOrder(input: { sessionId: string; orderId: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/payments/paypal/authorize', 'post'>>('authorizePayPalOrder', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/payments/paypal/authorize`,
        body: { orderId: input.orderId },
      });
    },

    authorizeHold(input: { sessionId: string; paymentIntentId?: string; holdCents?: number }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/authorize-hold', 'post'>>('authorizeHold', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/authorize-hold`,
        body: {
          paymentIntentId: input.paymentIntentId,
          holdCents: input.holdCents,
        },
      });
    },

    startConnecting(input: { sessionId: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/start-connecting', 'post'>>('startConnecting', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/start-connecting`,
      });
    },

    markConnected(input: { sessionId: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/mark-connected', 'post'>>('markConnected', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/mark-connected`,
      });
    },

    tick(input: { sessionId: string; asOfIso?: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/tick', 'post'>>('tick', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/tick`,
        body: input.asOfIso ? { asOfIso: input.asOfIso } : {},
      });
    },

    endAndCapture(input: { sessionId: string; reason?: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/end-and-capture', 'post'>>('endAndCapture', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/end-and-capture`,
        body: input.reason ? { reason: input.reason } : {},
      });
    },

    submitSessionReview(input: { sessionId: string; rating: number; body?: string; authorName?: string }) {
      return requestOperation<SuccessJson<'/v1/sessions/{sessionId}/reviews', 'post'>>('submitSessionReview', {
        method: 'POST',
        path: `/v1/sessions/${e(input.sessionId)}/reviews`,
        body: {
          rating: input.rating,
          body: input.body,
          authorName: input.authorName,
        },
      });
    },

    // ── Owner / API Keys (4) ─────────────────────────────────────────

    listApiKeys(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/api-keys', 'get'>>('listApiKeys', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/api-keys`,
      });
    },

    createApiKey(input: { groupId: string; name: string; scopes?: string[]; expiresAt?: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/api-keys', 'post'>>('createApiKey', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/api-keys`,
        body: { name: input.name, scopes: input.scopes, expiresAt: input.expiresAt },
      });
    },

    rotateApiKey(input: {
      groupId: string;
      keyId: string;
      overlapSeconds?: number;
      name?: string;
      expiresAt?: string;
    }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/api-keys/{keyId}/rotate', 'post'>>('rotateApiKey', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/api-keys/${e(input.keyId)}/rotate`,
        body: {
          overlapSeconds: input.overlapSeconds,
          name: input.name,
          expiresAt: input.expiresAt,
        },
      });
    },

    revokeApiKey(input: { groupId: string; keyId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/api-keys/{keyId}/revoke', 'post'>>('revokeApiKey', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/api-keys/${e(input.keyId)}/revoke`,
      });
    },

    // ── Widget (3) + Owner / Widget (2) ──────────────────────────────

    mintWidgetToken(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/widget/{groupId}/auth/token', 'post'>>('mintWidgetToken', {
        method: 'POST',
        path: `/v1/widget/${e(input.groupId)}/auth/token`,
      });
    },

    getWidgetConfig(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/widget/{groupId}/config', 'get'>>('getWidgetConfig', {
        method: 'GET',
        path: `/v1/widget/${e(input.groupId)}/config`,
      });
    },

    listWidgetAdvisors(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/widget/{groupId}/advisors', 'get'>>('listWidgetAdvisors', {
        method: 'GET',
        path: `/v1/widget/${e(input.groupId)}/advisors`,
      });
    },

    getWidgetSecurity(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/widget/security', 'get'>>('getWidgetSecurity', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/widget/security`,
      });
    },

    updateWidgetSecurity(input: { groupId: string; allowedOrigins: string[] }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/widget/security', 'put'>>('updateWidgetSecurity', {
        method: 'PUT',
        path: `/v1/owner/groups/${e(input.groupId)}/widget/security`,
        body: { allowedOrigins: input.allowedOrigins },
      });
    },

    // ── Owner / Invites (5) ──────────────────────────────────────────

    createInvite(input: { groupId: string; email?: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/invites', 'post'>>('createInvite', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/invites`,
        body: input.email ? { email: input.email } : {},
      });
    },

    listInvites(input: { groupId: string; status?: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/invites', 'get'>>('listInvites', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/invites`,
        query: { status: input.status },
      });
    },

    rotateInvite(input: { groupId: string; inviteId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/invites/{inviteId}/rotate', 'post'>>('rotateInvite', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/invites/${e(input.inviteId)}/rotate`,
      });
    },

    revokeInvite(input: { groupId: string; inviteId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/invites/{inviteId}/revoke', 'post'>>('revokeInvite', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/invites/${e(input.inviteId)}/revoke`,
      });
    },

    sendInvite(input: { groupId: string; inviteId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/invites/{inviteId}/send', 'post'>>('sendInvite', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/invites/${e(input.inviteId)}/send`,
      });
    },

    // ── Owner / Groups (4) ───────────────────────────────────────────

    getGroupBySlug(input: { slug: string }) {
      return requestOperation<SuccessJson<'/v1/groups/by-slug/{slug}', 'get'>>('getGroupBySlug', {
        method: 'GET',
        path: `/v1/groups/by-slug/${e(input.slug)}`,
      });
    },

    updateGroupSlug(input: { groupId: string; slug: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/slug', 'patch'>>('updateGroupSlug', {
        method: 'PATCH',
        path: `/v1/owner/groups/${e(input.groupId)}/slug`,
        body: { slug: input.slug },
      });
    },

    getGroupSettings(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/settings', 'get'>>('getGroupSettings', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/settings`,
      });
    },

    updateGroupSettings(input: {
      groupId: string;
      callerIdDisplayName?: string;
      requireCallerOtp?: boolean;
      minBillableSeconds?: number;
      droppedCallThresholdSeconds?: number;
      maxCallMinutes?: number;
      autoRecordCalls?: boolean;
      allowAnonymousCallers?: boolean;
      freeIntroSeconds?: number;
    }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/settings', 'patch'>>('updateGroupSettings', {
        method: 'PATCH',
        path: `/v1/owner/groups/${e(input.groupId)}/settings`,
        body: {
          callerIdDisplayName: input.callerIdDisplayName,
          requireCallerOtp: input.requireCallerOtp,
          minBillableSeconds: input.minBillableSeconds,
          droppedCallThresholdSeconds: input.droppedCallThresholdSeconds,
          maxCallMinutes: input.maxCallMinutes,
          autoRecordCalls: input.autoRecordCalls,
          allowAnonymousCallers: input.allowAnonymousCallers,
          freeIntroSeconds: input.freeIntroSeconds,
        },
      });
    },

    uploadGroupVoicePrompt(input: {
      groupId: string;
      promptKey: 'hold' | 'gather' | 'gather-timeout' | 'goodbye' | 'connecting';
      file: Blob;
      filename?: string;
    }) {
      const form = new FormData();
      form.append('file', input.file, input.filename ?? 'voice-prompt');
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/voice-prompts/{promptKey}', 'post'>>('uploadGroupVoicePrompt', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/voice-prompts/${e(input.promptKey)}`,
        body: form,
      });
    },

    clearGroupVoicePrompt(input: {
      groupId: string;
      promptKey: 'hold' | 'gather' | 'gather-timeout' | 'goodbye' | 'connecting';
    }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/voice-prompts/{promptKey}', 'delete'>>('clearGroupVoicePrompt', {
        method: 'DELETE',
        path: `/v1/owner/groups/${e(input.groupId)}/voice-prompts/${e(input.promptKey)}`,
      });
    },

    getPayoutPolicy(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/payout-policy', 'get'>>('getPayoutPolicy', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/payout-policy`,
      });
    },

    getOwnerPayoutPortfolio() {
      return requestOperation<SuccessJson<'/v1/owner/payouts/portfolio', 'get'>>('getOwnerPayoutPortfolio', {
        method: 'GET',
        path: '/v1/owner/payouts/portfolio',
      });
    },

    updatePayoutPolicy(input: {
      groupId: string;
      platformFeeBps?: number;
      ownerCommissionBps?: number;
      ownerCommissionRate?: number;
      ownerCommissionBase?: 'gross' | 'post_platform_fee';
      processingFeePayer?: 'platform' | 'owner';
      payoutDelayDays?: number;
      minimumPayoutCents?: number;
      reserveBps?: number;
      payoutMode?: 'managed';
    }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/payout-policy', 'patch'>>('updatePayoutPolicy', {
        method: 'PATCH',
        path: `/v1/owner/groups/${e(input.groupId)}/payout-policy`,
        body: {
          platformFeeBps: input.platformFeeBps,
          ownerCommissionBps: input.ownerCommissionBps,
          ownerCommissionRate: input.ownerCommissionRate,
          ownerCommissionBase: input.ownerCommissionBase,
          processingFeePayer: input.processingFeePayer,
          payoutDelayDays: input.payoutDelayDays,
          minimumPayoutCents: input.minimumPayoutCents,
          reserveBps: input.reserveBps,
          payoutMode: input.payoutMode,
        },
      });
    },

    // ── Owner / Advisors (5) ────────────────────────────────────────

    listOwnerAdvisors(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/advisors', 'get'>>('listOwnerAdvisors', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/advisors`,
      });
    },

    moderateAdvisor(input: {
      groupId: string;
      advisorId: string;
      action: 'approve' | 'reject' | 'suspend' | 'unsuspend';
      reason?: string;
      note?: string;
    }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/advisors/{advisorId}/moderate', 'post'>>('moderateAdvisor', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/advisors/${e(input.advisorId)}/moderate`,
        body: { action: input.action, reason: input.reason, note: input.note },
      });
    },

    listAdvisorModerationEvents(input: {
      groupId: string;
      advisorId: string;
      before?: string;
      limit?: number;
    }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/advisors/{advisorId}/events', 'get'>>('listAdvisorModerationEvents', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/advisors/${e(input.advisorId)}/events`,
        query: { before: input.before, limit: input.limit },
      });
    },

    listGroupModerationEvents(input: { groupId: string; before?: string; limit?: number }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/events', 'get'>>('listGroupModerationEvents', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/events`,
        query: { before: input.before, limit: input.limit },
      });
    },

    removeAdvisor(input: { groupId: string; advisorId: string; reason?: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/advisors/{advisorId}', 'post'>>('removeAdvisor', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/advisors/${e(input.advisorId)}`,
        body: input.reason ? { reason: input.reason } : {},
      });
    },

    // ── Owner / Setup & Theme (3) ───────────────────────────────────

    updateGroupTheme(input: { groupId: string; theme: Record<string, unknown> }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/theme', 'patch'>>('updateGroupTheme', {
        method: 'PATCH',
        path: `/v1/owner/groups/${e(input.groupId)}/theme`,
        body: { theme: input.theme },
      });
    },

    getSetupState(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/setup-state', 'get'>>('getSetupState', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/setup-state`,
      });
    },

    updateSetupState(input: { groupId: string; setupState: Record<string, unknown> }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/setup-state', 'patch'>>('updateSetupState', {
        method: 'PATCH',
        path: `/v1/owner/groups/${e(input.groupId)}/setup-state`,
        body: { setupState: input.setupState },
      });
    },

    // ── Owner / Analytics (4) ────────────────────────────────────────

    getAnalyticsOverview(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/analytics/overview', 'get'>>('getAnalyticsOverview', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/analytics/overview`,
      });
    },

    getAnalyticsRevenue(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/analytics/revenue', 'get'>>('getAnalyticsRevenue', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/analytics/revenue`,
      });
    },

    getAnalyticsSessions(input: { groupId: string; page?: number; limit?: number }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/analytics/sessions', 'get'>>('getAnalyticsSessions', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/analytics/sessions`,
        query: { page: input.page, limit: input.limit },
      });
    },

    getWidgetEventAnalytics(input: { groupId: string; since?: string; limit?: number }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/analytics/widget-events', 'get'>>('getWidgetEventAnalytics', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/analytics/widget-events`,
        query: { since: input.since, limit: input.limit },
      });
    },

    // ── Owner / Payouts (4) ──────────────────────────────────────────

    listOwnerPayouts(input: { groupId: string; page?: number; limit?: number }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/payouts', 'get'>>('listOwnerPayouts', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/payouts`,
        query: { page: input.page, limit: input.limit },
      });
    },

    getPayoutReadiness(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/payout-readiness', 'get'>>('getPayoutReadiness', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/payout-readiness`,
      });
    },

    listPayoutRuns(input: { groupId: string; page?: number; limit?: number }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/payout-runs', 'get'>>('listPayoutRuns', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/payout-runs`,
        query: { page: input.page, limit: input.limit },
      });
    },

    createPayoutRun(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/payout-runs', 'post'>>('createPayoutRun', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/payout-runs`,
        body: {},
      });
    },

    getOwnerCommissionPayoutReadiness(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/owner-commission/readiness', 'get'>>('getOwnerCommissionPayoutReadiness', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/owner-commission/readiness`,
      });
    },

    listOwnerCommissionPayoutRuns(input: { groupId: string; page?: number; limit?: number }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/owner-commission/payout-runs', 'get'>>('listOwnerCommissionPayoutRuns', {
        method: 'GET',
        path: `/v1/owner/groups/${e(input.groupId)}/owner-commission/payout-runs`,
        query: { page: input.page, limit: input.limit },
      });
    },

    createOwnerCommissionPayoutRun(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/owner-commission/payout-runs', 'post'>>('createOwnerCommissionPayoutRun', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/owner-commission/payout-runs`,
        body: {},
      });
    },

    // ── Owner / Invites (Batch + Public invite flow) ────────────────

    batchCreateOwnerInvites(input: { groupId: string; emails: string[] }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/invites/batch', 'post'>>('batchCreateOwnerInvites', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/invites/batch`,
        body: { emails: input.emails },
      });
    },

    previewInvite(input: { token: string }) {
      return requestOperation<SuccessJson<'/v1/invites/{token}/preview', 'get'>>('previewInvite', {
        method: 'GET',
        path: `/v1/invites/${e(input.token)}/preview`,
      });
    },

    acceptInvite(input: { token: string }) {
      return requestOperation<SuccessJson<'/v1/invites/{token}/accept', 'post'>>('acceptInvite', {
        method: 'POST',
        path: `/v1/invites/${e(input.token)}/accept`,
      });
    },

    // ── Widget events + callbacks (3) ────────────────────────────────

    createWidgetCallback(input: { groupId: string; body: Record<string, unknown> }) {
      return requestOperation<SuccessJson<'/v1/widget/{groupId}/callbacks', 'post'>>('createWidgetCallback', {
        method: 'POST',
        path: `/v1/widget/${e(input.groupId)}/callbacks`,
        body: input.body,
      });
    },

    getWidgetCallbackStatus(input: { groupId: string; phone: string }) {
      return requestOperation<SuccessJson<'/v1/widget/{groupId}/callbacks/status', 'get'>>('getWidgetCallbackStatus', {
        method: 'GET',
        path: `/v1/widget/${e(input.groupId)}/callbacks/status`,
        query: { phone: input.phone },
      });
    },

    ingestWidgetEvent(input: {
      groupId: string;
      eventType: string;
      sessionId: string;
      eventData?: Record<string, unknown>;
    }) {
      return requestOperation<SuccessJson<'/v1/widget/{groupId}/events', 'post'>>('ingestWidgetEvent', {
        method: 'POST',
        path: `/v1/widget/${e(input.groupId)}/events`,
        body: { eventType: input.eventType, sessionId: input.sessionId, eventData: input.eventData },
      });
    },

    // ── SEO + taxonomy + widget generation (4) ───────────────────────

    getGroupSitemap(input: { groupSlug: string }) {
      return requestOperation<SuccessJson<'/v1/seo/groups/{groupSlug}/sitemap.xml', 'get'>>('getGroupSitemap', {
        method: 'GET',
        path: `/v1/seo/groups/${e(input.groupSlug)}/sitemap.xml`,
      });
    },

    getAdvisorJsonLd(input: { groupSlug: string; advisorId: string }) {
      return requestOperation<SuccessJson<'/v1/seo/groups/{groupSlug}/advisors/{advisorId}/jsonld', 'get'>>('getAdvisorJsonLd', {
        method: 'GET',
        path: `/v1/seo/groups/${e(input.groupSlug)}/advisors/${e(input.advisorId)}/jsonld`,
      });
    },

    getTaxonomy() {
      return requestOperation<SuccessJson<'/v1/taxonomy', 'get'>>('getTaxonomy', {
        method: 'GET',
        path: '/v1/taxonomy',
      });
    },

    generateWidgetEmbedCode(input: { groupId: string }) {
      return requestOperation<SuccessJson<'/v1/owner/groups/{groupId}/widget/generate', 'post'>>('generateWidgetEmbedCode', {
        method: 'POST',
        path: `/v1/owner/groups/${e(input.groupId)}/widget/generate`,
      });
    },
  };
}

export type V1MethodSet = ReturnType<typeof createV1MethodSet>;

export type PickedClientMethods<T extends readonly (keyof V1MethodSet)[]> = Pick<V1MethodSet, T[number]>;

export function pickClientMethods<T extends readonly (keyof V1MethodSet)[]>(
  methods: V1MethodSet,
  methodNames: T,
): PickedClientMethods<T> {
  const picked = {} as PickedClientMethods<T>;
  for (const methodName of methodNames) {
    (picked as Record<keyof V1MethodSet, V1MethodSet[keyof V1MethodSet]>)[methodName] = methods[methodName];
  }
  return picked;
}

/**
 * @deprecated Use auth-specific subpath entrypoints instead:
 * `@advizorconnect/sdk/integration`, `@advizorconnect/sdk/owner`, or
 * `@advizorconnect/sdk/widget`. The mixed v1 client is retained only as a
 * compatibility wrapper for the 0.2.x migration window.
 */
export function createV1Client(options: V1ClientOptions) {
  assertApiKeyClientAllowedInRuntime(options);

  const request = createSdkRequester({
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    authHeaders: createBearerAuthHeaderProvider(
      () => options.apiKey,
      {
        missingMessage: 'SDK API key is required for createV1Client.',
        missingCode: 'SDK_API_KEY_MISSING',
      },
    ),
  });
  return createV1MethodSet(request);
}

// Type declarations for the anore Node.js SDK.

export interface AnoreClientOptions {
  /** API key from the dashboard (an_live_… / an_test_…) */
  apiKey: string
  /** optional signing secret — signs outgoing requests with Anore-Signature */
  secret?: string | null
  /** API base, defaults to https://api.anore.cc/v1 */
  baseUrl?: string
  /** per-request timeout in ms (default 30000) */
  timeout?: number
  /** retries on network errors / 5xx (default 2) */
  maxRetries?: number
}

export interface CreatePaymentParams {
  /** amount in rubles, must be > 0 */
  amount: number
  /** description shown to the customer */
  description: string
  /** your own order reference */
  orderId?: string
  /** shop id — required for account-level keys */
  shopId?: number
}

export type PaymentStatus = 'new' | 'paid' | 'expired'

export class Payment {
  raw: Record<string, unknown>
  readonly id: string
  readonly orderId: string | null
  readonly amount: number
  readonly currency: string
  readonly status: PaymentStatus
  readonly paid: boolean
  readonly paymentUrl?: string
  readonly expiresIn?: number
}

export class WebhookEvent {
  raw: Record<string, unknown>
  readonly event: string
  readonly id: string
  readonly orderId: string | null
  readonly amount: number
  readonly currency: string
  readonly status: PaymentStatus
  readonly description?: string
  readonly shop?: string
  readonly createdAt?: string
  readonly isSucceeded: boolean
}

export class AnoreClient {
  constructor(opts: AnoreClientOptions)
  createPayment(params: CreatePaymentParams): Promise<Payment>
  getPayment(id: string): Promise<Payment>
}

export const DEFAULT_BASE_URL: string

/** Verify an incoming webhook signature (use the RAW request body). */
export function verifyWebhook(rawBody: string | Buffer, signature: string, secret: string): boolean
/** Verify + parse; throws SignatureError on mismatch. */
export function parseWebhook(rawBody: string | Buffer, signature: string, secret: string): WebhookEvent

export class AnoreError extends Error {}
export class APIError extends AnoreError {
  status: number
  data: unknown
  requestId: string | null
}
export class ValidationError extends APIError {}
export class AuthenticationError extends APIError {}
export class ForbiddenError extends APIError {}
export class NotFoundError extends APIError {}
export class ServerError extends APIError {}
export class APIConnectionError extends AnoreError {}
export class SignatureError extends AnoreError {}

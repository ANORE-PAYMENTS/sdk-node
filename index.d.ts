export interface AnoreClientOptions {

  apiKey: string

  secret?: string | null

  baseUrl?: string

  timeout?: number

  maxRetries?: number
}

export interface CreatePaymentParams {

  amount: number

  description: string

  orderId?: string

  shopId?: number

  currency?: string

  methods?: string | string[]

  getbackUrl?: string

  successUrl?: string

  failUrl?: string

  callbackUrl?: string

  email?: string
}

export interface ListPaymentsParams {
  shopId?: number
  status?: 'paid' | 'pending' | 'failed' | 'written_off' | 'success' | 'succeeded' | 'new' | 'processing' | 'expired' | 'canceled' | 'cancelled' | 'written-off' | 'writtenoff'
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export interface ShopParams { shopId?: number }

export interface CreatePayoutParams {
  amount: number
  method: 'card' | 'sbp' | 'usdt_ton' | 'usdt_bep20' | 'usdt_trc20' | 'usdt_erc20'
  address: string
  shopId?: number
  bank?: string
  externalId?: string
}

export type PaymentStatus = 'new' | 'paid' | 'expired' | 'written_off'

export interface PayoutFeeRule {
  method: string
  label: string
  flatRub: number
  percentAbove: number
  surchargeRub: number
  [key: string]: unknown
}

export class Payment {
  raw: Record<string, unknown>
  readonly success: boolean
  readonly id: string
  readonly orderId: string | null
  readonly amount: number
  readonly baseAmount?: number
  readonly currency: string
  readonly currencyRate?: number
  readonly rubAmount?: number
  readonly description?: string
  readonly status: PaymentStatus
  readonly paid: boolean
  readonly test: boolean
  readonly paymentUrl?: string
  readonly sbpUrl?: string
  readonly expiresIn?: number
  readonly method?: string
  readonly createdAt?: string
  readonly paidAt?: string
}

export class PaymentList implements Iterable<Payment> {
  raw: Record<string, unknown>
  readonly payments: Payment[]
  readonly success: boolean
  readonly shopId: number
  readonly total: number
  readonly limit: number
  readonly offset: number
  [Symbol.iterator](): Iterator<Payment>
}

export class Balance {
  raw: Record<string, unknown>
  readonly currency: string
  readonly available: number
  readonly shopLocalBalance: number
  readonly shopLocalAvailable: number
  readonly accountAvailable: number
  readonly hold: number
  readonly frozen: number
  readonly matured: number
  readonly paidAmount: number
  readonly withdrawn: number
  readonly reserved: number
  readonly legacyPayoutsUnassigned: boolean
  readonly fee: Record<string, unknown>
  readonly minAmount: number
  readonly minAmountByMethod: Record<string, number>
  readonly maxAmount: number
  readonly maxAmountByMethod: Record<string, number>
  readonly usdtRateRub: number
  readonly rapiraMarketUsdtRub: number
  readonly rapiraMarkupPercent: number
  readonly rateBasis?: string
  readonly rapiraFixing?: string
  readonly cbrRateRub: number
  readonly sbpBanks: Array<Record<string, unknown>>
}

export class PayoutFees {
  raw: Record<string, unknown>
  readonly shopId: number
  readonly currency: string
  readonly thresholdRub: number
  readonly minAmountRub: number
  readonly minAmountRubByMethod: Record<string, number>
  readonly maxAmountRub: number
  readonly maxAmountRubByMethod: Record<string, number>
  readonly methods: PayoutFeeRule[]
}

export class PayoutRates {
  raw: Record<string, unknown>
  readonly shopId: number
  readonly ratePolicy: string
  readonly rateBasis?: string
  readonly sbpRatePolicy?: string
  readonly rapiraUsdtRub: number
  readonly rapiraMarketUsdtRub: number
  readonly rapiraMarkupPercent: number
  readonly cbrUsdRub: number
  readonly rubToUsdt: number
  readonly usdtToRub: number
  readonly rubToRubSettlement: number
  readonly rapiraFixing: string
  readonly fees: PayoutFeeRule[]
}

export class Payout {
  raw: Record<string, unknown>
  readonly id: string
  readonly shopId?: number
  readonly legacy: boolean
  readonly status: string
  readonly amount: number
  readonly method: string
  readonly address: string
  readonly bank?: string
  readonly fee?: number
  readonly netRub?: number
  readonly amountUsdt?: number
  readonly rapiraRate?: number
  readonly cbrRate?: number
  readonly settlementRub?: number
  readonly quoteType?: string
  readonly ratePolicy?: string
  readonly rateBasis?: string
  readonly quoteAppliedAt?: string | null
  readonly manualCorrection: boolean
  readonly statusRevision?: number
  readonly externalId?: string
  readonly createdAt?: string
  readonly processedAt?: string
  readonly txHash?: string
}

export class WebhookEvent {
  raw: Record<string, unknown>
  readonly event: string
  readonly id: string
  readonly orderId: string | null
  readonly amount: number
  readonly rubAmount?: number
  readonly currency: string
  readonly currencyRate?: number
  readonly status: PaymentStatus | 'pending' | 'approved' | 'processing' | 'rejected'
  readonly description?: string
  readonly shop?: string
  readonly createdAt?: string
  readonly isSucceeded: boolean
  readonly isPayout: boolean
  readonly externalId?: string
  readonly shopId?: number
  readonly method?: string
  readonly fee?: number
  readonly netRub?: number
  readonly amountUsdt?: number
  readonly settlementRub?: number
  readonly processedAt?: string
  readonly txHash?: string
  readonly manualCorrection: boolean
  readonly statusRevision?: number
}

export class AnoreClient {
  constructor(opts: AnoreClientOptions)
  createPayment(params: CreatePaymentParams): Promise<Payment>
  getPayment(id: string): Promise<Payment>
  listPayments(params?: ListPaymentsParams): Promise<PaymentList>
  getBalance(params?: ShopParams): Promise<Balance>
  getPayoutFees(params?: ShopParams): Promise<PayoutFees>
  getPayoutRates(params?: ShopParams): Promise<PayoutRates>
  createPayout(params: CreatePayoutParams): Promise<Payout>
  getPayout(id: string): Promise<Payout>
}

export const DEFAULT_BASE_URL: string

export function verifyWebhook(rawBody: string | Buffer, signature: string, secret: string): boolean

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

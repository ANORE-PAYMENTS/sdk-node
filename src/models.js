'use strict'

class Payment {
  constructor(raw) {
    this.raw = raw || {}
  }
  get success() { return Boolean(this.raw.success) }
  get id() { return this.raw.id }
  get orderId() { return this.raw.orderId ?? null }
  get amount() { return this.raw.amount }
  get baseAmount() { return this.raw.baseAmount }
  get currency() { return this.raw.currency }
  get currencyRate() { return this.raw.currencyRate }
  get rubAmount() { return this.raw.rubAmount }
  get description() { return this.raw.description }
  get status() { return this.raw.status }
  get paid() { return Boolean(this.raw.paid) }
  get test() { return Boolean(this.raw.test) }
  get paymentUrl() { return this.raw.paymentUrl }
  get sbpUrl() { return this.raw.sbpUrl }
  get expiresIn() { return this.raw.expiresIn }
  get method() { return this.raw.method }
  get createdAt() { return this.raw.createdAt }
  get paidAt() { return this.raw.paidAt }
}

class PaymentList {
  constructor(raw) { this.raw = raw || {} }
  get payments() { return (this.raw.payments || []).map((item) => new Payment(item)) }
  get success() { return Boolean(this.raw.success) }
  get shopId() { return this.raw.shopId }
  get total() { return this.raw.total || 0 }
  get limit() { return this.raw.limit || 0 }
  get offset() { return this.raw.offset || 0 }
  [Symbol.iterator]() { return this.payments[Symbol.iterator]() }
}

class Balance {
  constructor(raw) { this.raw = raw || {} }
  get currency() { return this.raw.currency }
  get available() { return this.raw.available }
  get shopLocalBalance() { return this.raw.shopLocalBalance }
  get shopLocalAvailable() { return this.raw.shopLocalAvailable }
  get accountAvailable() { return this.raw.accountAvailable }
  get hold() { return this.raw.hold }
  get frozen() { return this.raw.frozen }
  get matured() { return this.raw.matured }
  get paidAmount() { return this.raw.paidAmount }
  get withdrawn() { return this.raw.withdrawn }
  get reserved() { return this.raw.reserved }
  get legacyPayoutsUnassigned() { return Boolean(this.raw.legacyPayoutsUnassigned) }
  get fee() { return this.raw.fee || {} }
  get minAmount() { return this.raw.minAmount }
  get minAmountByMethod() { return this.raw.minAmountByMethod || {} }
  get maxAmount() { return this.raw.maxAmount }
  get maxAmountByMethod() { return this.raw.maxAmountByMethod || {} }
  get usdtRateRub() { return this.raw.usdtRateRub }
  get rapiraMarketUsdtRub() { return this.raw.rapiraMarketUsdtRub }
  get rapiraMarkupPercent() { return this.raw.rapiraMarkupPercent }
  get rateBasis() { return this.raw.rateBasis }
  get rapiraFixing() { return this.raw.rapiraFixing }
  get cbrRateRub() { return this.raw.cbrRateRub }
  get sbpBanks() { return this.raw.sbpBanks || [] }
}

class PayoutFees {
  constructor(raw) { this.raw = raw || {} }
  get shopId() { return this.raw.shopId }
  get currency() { return this.raw.currency }
  get thresholdRub() { return this.raw.thresholdRub }
  get minAmountRub() { return this.raw.minAmountRub }
  get minAmountRubByMethod() { return this.raw.minAmountRubByMethod || {} }
  get maxAmountRub() { return this.raw.maxAmountRub }
  get maxAmountRubByMethod() { return this.raw.maxAmountRubByMethod || {} }
  get methods() { return this.raw.methods || [] }
}

class PayoutRates {
  constructor(raw) { this.raw = raw || {} }
  get shopId() { return this.raw.shopId }
  get ratePolicy() { return this.raw.ratePolicy }
  get rateBasis() { return this.raw.rateBasis }
  get sbpRatePolicy() { return this.raw.sbpRatePolicy }
  get rapiraUsdtRub() { return this.raw.rapiraUsdtRub }
  get rapiraMarketUsdtRub() { return this.raw.rapiraMarketUsdtRub }
  get rapiraMarkupPercent() { return this.raw.rapiraMarkupPercent }
  get cbrUsdRub() { return this.raw.cbrUsdRub }
  get rubToUsdt() { return this.raw.rubToUsdt }
  get usdtToRub() { return this.raw.usdtToRub }
  get rubToRubSettlement() { return this.raw.rubToRubSettlement }
  get rapiraFixing() { return this.raw.rapiraFixing }
  get fees() { return this.raw.fees || [] }
}

class Payout {
  constructor(raw) { this.raw = raw || {} }
  get id() { return this.raw.id }
  get shopId() { return this.raw.shopId }
  get legacy() { return Boolean(this.raw.legacy) }
  get status() { return this.raw.status }
  get amount() { return this.raw.amount }
  get method() { return this.raw.methodCode || this.raw.method }
  get address() { return this.raw.address }
  get bank() { return this.raw.bank }
  get fee() { return this.raw.fee }
  get netRub() { return this.raw.netRub }
  get amountUsdt() { return this.raw.amountUsdt }
  get rapiraRate() { return this.raw.rapiraRate }
  get cbrRate() { return this.raw.cbrRate }
  get settlementRub() { return this.raw.settlementRub }
  get quoteType() { return this.raw.quoteType }
  get ratePolicy() { return this.raw.ratePolicy }
  get rateBasis() { return this.raw.rateBasis }
  get quoteAppliedAt() { return this.raw.quoteAppliedAt }
  get manualCorrection() { return Boolean(this.raw.manualCorrection) }
  get statusRevision() { return this.raw.statusRevision }
  get externalId() { return this.raw.externalId }
  get createdAt() { return this.raw.createdAt }
  get processedAt() { return this.raw.processedAt }
  get txHash() { return this.raw.txHash }
}

class PayoutList {
  constructor(raw) { this.raw = raw || {} }
  get shopId() { return this.raw.shopId }
  get limit() { return this.raw.limit }
  get payouts() { return (this.raw.items || []).map((item) => new Payout(item)) }
  get hasMore() { return Boolean(this.raw.hasMore) }
  get nextCursor() { return this.raw.nextCursor ?? null }
  [Symbol.iterator]() { return this.payouts[Symbol.iterator]() }
}

class SubscriptionCatalog {
  constructor(raw) { this.raw = raw || {} }
  get shopIdRequired() { return Boolean(this.raw.shopIdRequired) }
  get environment() { return this.raw.environment }
  get shops() { return this.raw.shops || [] }
}

class SubscriptionBinding {
  constructor(raw) { this.raw = raw || {} }
  get subscriptionId() { return this.raw.subscriptionId }
  get shopId() { return this.raw.shopId }
  get status() { return this.raw.status }
  get qrUrl() { return this.raw.qrUrl }
  get environment() { return this.raw.environment }
}

class SubscriptionCharge {
  constructor(raw) { this.raw = raw || {} }
  get subscriptionId() { return this.raw.subscriptionId }
  get chargeId() { return this.raw.chargeId }
  get paymentId() { return this.raw.paymentId ?? null }
  get status() { return this.raw.status }
}

class SubscriptionStatus {
  constructor(raw) { this.raw = raw || {} }
  get subscriptionId() { return this.raw.subscriptionId }
  get shopId() { return this.raw.shopId }
  get planId() { return this.raw.planId }
  get planTitle() { return this.raw.planTitle }
  get status() { return this.raw.status }
  get customerId() { return this.raw.customerId }
  get customerEmail() { return this.raw.customerEmail }
  get amount() { return this.raw.amount }
  get paymentMethod() { return this.raw.paymentMethod ?? null }
  get environment() { return this.raw.environment }
  get nextChargeAt() { return this.raw.nextChargeAt ?? null }
}

class WebhookEvent {
  constructor(raw) {
    this.raw = raw || {}
  }

  get event() { return this.raw.event }
  get id() { return this.raw.id }
  get orderId() { return this.raw.orderId ?? null }
  get amount() { return this.raw.amount }
  get rubAmount() { return this.raw.rubAmount }
  get currency() { return this.raw.currency }
  get currencyRate() { return this.raw.currencyRate }
  get status() { return this.raw.status }
  get description() { return this.raw.description }
  get shop() { return this.raw.shop }
  get createdAt() { return this.raw.createdAt }
  get isSucceeded() { return this.event === 'payment.succeeded' || this.event === 'payout.succeeded' }
  get isPayout() { return Boolean(this.event && this.event.startsWith('payout.')) }
  get externalId() { return this.raw.externalId }
  get shopId() { return this.raw.shopId }
  get method() { return this.raw.method }
  get fee() { return this.raw.fee }
  get netRub() { return this.raw.netRub }
  get amountUsdt() { return this.raw.amountUsdt }
  get settlementRub() { return this.raw.settlementRub }
  get processedAt() { return this.raw.processedAt }
  get txHash() { return this.raw.txHash }
  get manualCorrection() { return Boolean(this.raw.manualCorrection) }
  get statusRevision() { return this.raw.statusRevision }
}

module.exports = {
  Balance,
  Payment,
  PaymentList,
  Payout,
  PayoutFees,
  PayoutList,
  PayoutRates,
  SubscriptionBinding,
  SubscriptionCatalog,
  SubscriptionCharge,
  SubscriptionStatus,
  WebhookEvent,
}

'use strict'

// Typed response wrappers over the API JSON. Each keeps the raw object on `.raw`
// so forward-compatible fields are never lost.

class Payment {
  constructor(raw) {
    this.raw = raw || {}
  }
  get id() { return this.raw.id }
  get orderId() { return this.raw.orderId ?? null }
  get amount() { return this.raw.amount }
  get currency() { return this.raw.currency }
  /** 'new' | 'paid' | 'expired' */
  get status() { return this.raw.status }
  get paid() { return Boolean(this.raw.paid) }
  get paymentUrl() { return this.raw.paymentUrl }
  get expiresIn() { return this.raw.expiresIn }
}

class WebhookEvent {
  constructor(raw) {
    this.raw = raw || {}
  }
  /** e.g. 'payment.succeeded' */
  get event() { return this.raw.event }
  get id() { return this.raw.id }
  get orderId() { return this.raw.orderId ?? null }
  get amount() { return this.raw.amount }
  get currency() { return this.raw.currency }
  get status() { return this.raw.status }
  get description() { return this.raw.description }
  get shop() { return this.raw.shop }
  get createdAt() { return this.raw.createdAt }
  get isSucceeded() { return this.event === 'payment.succeeded' }
}

module.exports = { Payment, WebhookEvent }

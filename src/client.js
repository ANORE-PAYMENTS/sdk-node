'use strict'

const { Transport } = require('./transport')
const {
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
} = require('./models')

const DEFAULT_BASE_URL = 'https://api.anore.cc/api/v1'

class AnoreClient {

  constructor({ apiKey, secret = null, baseUrl = DEFAULT_BASE_URL, timeout = 30000, maxRetries = 2 } = {}) {
    if (!apiKey) throw new Error('AnoreClient: apiKey is required')
    this._http = new Transport({ baseUrl, apiKey, secret, timeout, maxRetries })
  }

  async createPayment({
    amount,
    description,
    orderId,
    shopId,
    currency = 'rub',
    methods,
    getbackUrl,
    successUrl,
    failUrl,
    callbackUrl,
    email,
    userIdentity,
    franchise,
  } = {}) {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || !(amount > 0)) throw new Error('createPayment: amount must be a finite number > 0')
    if (!description) throw new Error('createPayment: description is required')
    const body = { amount, description }
    if (orderId != null) body.orderId = orderId
    if (shopId != null) body.shopId = shopId
    if (currency) body.currency = currency
    if (methods != null) body.methods = methods
    if (getbackUrl != null) body.getbackurl = getbackUrl
    if (successUrl != null) body.successurl = successUrl
    if (failUrl != null) body.failurl = failUrl
    if (callbackUrl != null) body.callbackUrl = callbackUrl
    if (email != null) body.email = email
    if (userIdentity != null) body.user_identity = userIdentityBody(userIdentity)
    if (franchise != null) body.franchise = franchiseBody(franchise)
    return new Payment(await this._http.request('POST', '/payments', body))
  }

  async getPayment(id) {
    if (!id) throw new Error('getPayment: id is required')
    return new Payment(await this._http.request('GET', `/payments/${encodeURIComponent(id)}`))
  }

  async listPayments({ shopId, status, from, to, limit = 50, offset = 0 } = {}) {
    const query = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (shopId != null) query.set('shopId', String(shopId))
    if (status != null) query.set('status', status)
    if (from != null) query.set('from', from)
    if (to != null) query.set('to', to)
    return new PaymentList(await this._http.request('GET', `/payments?${query}`))
  }

  async getSubscriptionCatalog() {
    return new SubscriptionCatalog(await this._http.request('GET', '/subscriptions/catalog'))
  }

  async createSubscription({ planId, customerId, customerEmail, idempotencyKey, shopId } = {}) {
    if (!planId) throw new Error('createSubscription: planId is required')
    if (!customerId) throw new Error('createSubscription: customerId is required')
    if (!customerEmail) throw new Error('createSubscription: customerEmail is required')
    validateIdempotencyKey(idempotencyKey, 'createSubscription')
    const body = { planId, customerId, customerEmail }
    if (shopId != null) body.shopId = shopId
    return new SubscriptionBinding(await this._http.request(
      'POST', '/subscriptions', body, { 'Idempotency-Key': idempotencyKey },
    ))
  }

  async chargeSubscription(id, { idempotencyKey } = {}) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('chargeSubscription: id must be a positive safe integer')
    validateIdempotencyKey(idempotencyKey, 'chargeSubscription')
    return new SubscriptionCharge(await this._http.request(
      'POST', `/subscriptions/${id}/charges`, undefined, { 'Idempotency-Key': idempotencyKey },
    ))
  }

  async getSubscription(id) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('getSubscription: id must be a positive safe integer')
    return new SubscriptionStatus(await this._http.request('GET', `/subscriptions/${id}`))
  }

  async getBalance({ shopId } = {}) {
    return new Balance(await this._http.request('GET', this._shopPath('/balance', shopId)))
  }

  async getPayoutFees({ shopId } = {}) {
    return new PayoutFees(await this._http.request('GET', this._shopPath('/payouts/fees', shopId)))
  }

  async getPayoutRates({ shopId } = {}) {
    return new PayoutRates(await this._http.request('GET', this._shopPath('/payouts/rates', shopId)))
  }

  async listPayouts({ shopId, limit = 50, cursor } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('listPayouts: limit must be an integer between 1 and 100')
    const query = new URLSearchParams({ limit: String(limit) })
    if (shopId != null) query.set('shopId', String(shopId))
    if (cursor != null) query.set('cursor', cursor)
    return new PayoutList(await this._http.request('GET', `/payouts?${query}`))
  }

  async createPayout({ amount, method, address, shopId, bank, externalId } = {}) {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || !(amount > 0)) throw new Error('createPayout: amount must be a finite number > 0')
    if (!method) throw new Error('createPayout: method is required')
    if (!address) throw new Error('createPayout: address is required')
    const body = { amount, method, address }
    if (shopId != null) body.shopId = shopId
    if (bank != null) body.bank = bank
    if (externalId != null) body.externalId = externalId
    return new Payout(await this._http.request('POST', '/payouts', body))
  }

  async getPayout(id) {
    if (!id) throw new Error('getPayout: id is required')
    return new Payout(await this._http.request('GET', `/payouts/${encodeURIComponent(id)}`))
  }

  _shopPath(path, shopId) {
    if (shopId == null) return path
    return `${path}?${new URLSearchParams({ shopId: String(shopId) })}`
  }
}

function validateIdempotencyKey(value, operation) {
  if (typeof value !== 'string' || !value.trim() || value.length > 128) {
    throw new Error(`${operation}: idempotencyKey must be a string of 1 to 128 characters`)
  }
}

function exactObject(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`${label} must be a plain object`)
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label} contains unsupported fields`)
  }
}

function telegramId(value, label) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive safe integer or canonical decimal string`)
    return value
  }
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) {
    throw new Error(`${label} must be a positive signed-64 decimal string`)
  }
  return value
}

function telegramUsername(value, label) {
  if (typeof value !== 'string' || !/^@?[A-Za-z0-9_]{5,32}$/.test(value)) {
    throw new Error(`${label} must be a Telegram username`)
  }
  return value
}

function userIdentityBody(value) {
  exactObject(value, new Set(['type', 'value', 'telegramUsername']), 'createPayment: userIdentity')
  if (!['telegram_id', 'email', 'username', 'external_id'].includes(value.type)) {
    throw new Error('createPayment: userIdentity has an unsupported type')
  }
  const identityValue = value.type === 'telegram_id'
    ? telegramId(value.value, 'createPayment: userIdentity.value')
    : value.value
  if (value.type !== 'telegram_id' && (typeof identityValue !== 'string' || !identityValue.trim() || identityValue.length > 190)) {
    throw new Error('createPayment: userIdentity.value must be a nonempty string of at most 190 characters')
  }
  const body = { type: value.type, value: identityValue }
  if (Object.hasOwn(value, 'telegramUsername')) {
    if (value.type !== 'telegram_id') throw new Error('createPayment: telegramUsername is allowed only with telegram_id')
    body.telegram_username = telegramUsername(value.telegramUsername, 'createPayment: userIdentity.telegramUsername')
  }
  return body
}

function franchiseBody(value) {
  exactObject(value, new Set(['type', 'address', 'ownerTelegramId', 'ownerTelegramUsername']), 'createPayment: franchise')
  if (!['telegram_bot', 'website'].includes(value.type)) throw new Error('createPayment: franchise has an unsupported type')
  if (typeof value.address !== 'string' || !value.address.trim()) throw new Error('createPayment: franchise.address is required')
  if (value.type === 'telegram_bot') {
    telegramUsername(value.address, 'createPayment: franchise.address')
  } else {
    let url
    try { url = new URL(value.address) } catch { throw new Error('createPayment: franchise.address must be a canonical HTTPS origin') }
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || !['', '/'].includes(url.pathname)) {
      throw new Error('createPayment: franchise.address must be a canonical HTTPS origin')
    }
  }
  const body = {
    type: value.type,
    address: value.address,
    owner_telegram_id: telegramId(value.ownerTelegramId, 'createPayment: franchise.ownerTelegramId'),
  }
  if (Object.hasOwn(value, 'ownerTelegramUsername')) {
    body.owner_telegram_username = telegramUsername(value.ownerTelegramUsername, 'createPayment: franchise.ownerTelegramUsername')
  }
  return body
}

module.exports = { AnoreClient, DEFAULT_BASE_URL }

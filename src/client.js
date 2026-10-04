'use strict'

const { Transport } = require('./transport')
const { Balance, Payment, PaymentList, Payout, PayoutFees, PayoutRates } = require('./models')

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

  async getBalance({ shopId } = {}) {
    return new Balance(await this._http.request('GET', this._shopPath('/balance', shopId)))
  }

  async getPayoutFees({ shopId } = {}) {
    return new PayoutFees(await this._http.request('GET', this._shopPath('/payouts/fees', shopId)))
  }

  async getPayoutRates({ shopId } = {}) {
    return new PayoutRates(await this._http.request('GET', this._shopPath('/payouts/rates', shopId)))
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

module.exports = { AnoreClient, DEFAULT_BASE_URL }

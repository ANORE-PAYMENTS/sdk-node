'use strict'

const { Transport } = require('./transport')
const { Payment } = require('./models')

const DEFAULT_BASE_URL = 'https://api.anore.cc/v1'

class AnoreClient {
  /**
   * @param {object} opts
   * @param {string} opts.apiKey   - key from the dashboard (an_live_… / an_test_…)
   * @param {string} [opts.secret] - optional signing secret; signs outgoing requests
   * @param {string} [opts.baseUrl] - defaults to https://api.anore.cc/v1
   * @param {number} [opts.timeout] - per-request timeout (ms), default 30000
   * @param {number} [opts.maxRetries] - retries on network/5xx, default 2
   */
  constructor({ apiKey, secret = null, baseUrl = DEFAULT_BASE_URL, timeout = 30000, maxRetries = 2 } = {}) {
    if (!apiKey) throw new Error('AnoreClient: apiKey is required')
    this._http = new Transport({ baseUrl, apiKey, secret, timeout, maxRetries })
  }

  /**
   * Create a payment / invoice (POST /payments).
   * @returns {Promise<Payment>} use `.paymentUrl` to redirect the customer.
   */
  async createPayment({ amount, description, orderId, shopId } = {}) {
    if (!(amount > 0)) throw new Error('createPayment: amount must be > 0')
    if (!description) throw new Error('createPayment: description is required')
    const body = { amount, description }
    if (orderId != null) body.orderId = orderId
    if (shopId != null) body.shopId = shopId
    return new Payment(await this._http.request('POST', '/payments', body))
  }

  /**
   * Fetch payment status (GET /payments/{id}).
   * @returns {Promise<Payment>} `.status` is 'new' | 'paid' | 'expired'.
   */
  async getPayment(id) {
    if (!id) throw new Error('getPayment: id is required')
    return new Payment(await this._http.request('GET', `/payments/${encodeURIComponent(id)}`))
  }
}

module.exports = { AnoreClient, DEFAULT_BASE_URL }

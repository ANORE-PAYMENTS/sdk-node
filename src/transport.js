'use strict'

const crypto = require('node:crypto')
const { errorForStatus, APIError, APIConnectionError } = require('./errors')

const USER_AGENT = 'anore-node/1.2.0'

function backoff(attempt) {
  return Math.min(500 * 2 ** attempt, 4000)
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

class Transport {
  constructor({ baseUrl, apiKey, secret = null, timeout = 30000, maxRetries = 2 }) {
    const base = new URL(baseUrl)
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
      throw new Error('AnoreClient: baseUrl must be an HTTP(S) API URL without credentials, query or fragment')
    }
    let path = base.pathname.replace(/\/+$/, '')
    if (!path) path = '/api/v1'
    else if (path === '/api') path += '/v1'
    this.baseUrl = base.origin + path
    this.apiKey = apiKey
    this.secret = secret
    if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('AnoreClient: timeout must be > 0')
    if (!Number.isInteger(maxRetries) || maxRetries < 0) throw new Error('AnoreClient: maxRetries must be a nonnegative integer')
    this.timeout = timeout
    this.maxRetries = maxRetries
  }

  async request(method, path, body) {
    const url = this.baseUrl + path
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    }
    let payload
    if (body !== undefined) {
      payload = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
      if (this.secret) {
        const signature = crypto
          .createHmac('sha256', this.secret)
          .update(payload)
          .digest('hex')
        headers['X-ZPay-Signature'] = signature
      }
    }

    const retries = method === 'GET' ? this.maxRetries : 0

    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), this.timeout)
      try {
        const res = await fetch(url, { method, headers, body: payload, signal: ctrl.signal, redirect: 'manual' })
        const text = await res.text()
        clearTimeout(t)
        const data = parseJson(text, res.status, res.ok)
        if (res.ok) return data
        if (res.status >= 500 && attempt < retries) {
          await sleep(backoff(attempt))
          continue
        }
        const requestId = res.headers.get('x-request-id')
        const message = typeof data.message === 'string' ? data.message : typeof data.error === 'string' ? data.error : 'request failed'
        throw errorForStatus(res.status, message, { data, requestId })
      } catch (e) {
        clearTimeout(t)

        if (e instanceof APIError) throw e
        if (attempt < retries) {
          await sleep(backoff(attempt))
          continue
        }
        throw new APIConnectionError(`could not reach anore API: ${e && e.message ? e.message : e}`)
      }
    }
  }
}

function parseJson(text, status, success) {
  try {
    const data = JSON.parse(text)
    if (data && typeof data === 'object' && !Array.isArray(data)) return data
  } catch {}
  if (success) throw new APIError('API returned an invalid JSON object', { status })
  return {}
}

module.exports = { Transport }

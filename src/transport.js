'use strict'

// Internal HTTP transport — global fetch (Node 18+) with retry/backoff on network
// errors and 5xx. Not part of the public API; use AnoreClient instead.

const crypto = require('node:crypto')
const { errorForStatus, APIConnectionError } = require('./errors')

const USER_AGENT = 'anore-node/1.0.0'

function backoff(attempt) {
  return Math.min(500 * 2 ** attempt, 4000)
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

class Transport {
  constructor({ baseUrl, apiKey, secret = null, timeout = 30000, maxRetries = 2 }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.apiKey = apiKey
    this.secret = secret
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
        headers['Anore-Signature'] = crypto
          .createHmac('sha256', this.secret)
          .update(payload)
          .digest('hex')
      }
    }

    let lastErr = null
    // retry only transient failures: network/timeout + 5xx. A received 4xx is
    // returned immediately (no retry).
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), this.timeout)
      try {
        const res = await fetch(url, { method, headers, body: payload, signal: ctrl.signal })
        clearTimeout(t)
        const text = await res.text()
        const data = parseJson(text)
        if (res.ok) return data
        if (res.status >= 500 && attempt < this.maxRetries) {
          lastErr = res.status
          await sleep(backoff(attempt))
          continue
        }
        const requestId = res.headers.get('x-request-id')
        const message = data.message || data.error || 'request failed'
        throw errorForStatus(res.status, message, { data, requestId })
      } catch (e) {
        clearTimeout(t)
        // our own APIError -> bubble up; only network/abort errors are retryable
        if (e && e.name && e.name.endsWith('Error') && typeof e.status === 'number') throw e
        lastErr = e
        if (attempt < this.maxRetries) {
          await sleep(backoff(attempt))
          continue
        }
        throw new APIConnectionError(`could not reach anore API: ${e && e.message ? e.message : e}`)
      }
    }
    throw new APIConnectionError(`could not reach anore API: ${lastErr}`)
  }
}

function parseJson(text) {
  if (!text) return {}
  try { return JSON.parse(text) } catch { return { raw: text } }
}

module.exports = { Transport }

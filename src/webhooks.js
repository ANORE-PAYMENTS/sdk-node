'use strict'

const crypto = require('node:crypto')
const { SignatureError } = require('./errors')
const { WebhookEvent } = require('./models')

/**
 * Verify an incoming webhook signature.
 * @param {string|Buffer} rawBody  - the RAW request body (never re-serialized JSON)
 * @param {string} signature       - the Anore-Signature header value
 * @param {string} secret          - signing secret from the dashboard (Webhooks tab)
 * @returns {boolean}
 */
function verifyWebhook(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(String(signature).trim().toLowerCase(), 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/**
 * Verify the signature and return the parsed event.
 * @throws {SignatureError} if the signature does not match
 * @returns {WebhookEvent}
 */
function parseWebhook(rawBody, signature, secret) {
  if (!verifyWebhook(rawBody, signature, secret)) {
    throw new SignatureError('webhook signature verification failed')
  }
  const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody
  return new WebhookEvent(JSON.parse(text))
}

module.exports = { verifyWebhook, parseWebhook }

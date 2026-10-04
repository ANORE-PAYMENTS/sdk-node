'use strict'

const crypto = require('node:crypto')
const { SignatureError } = require('./errors')
const { WebhookEvent } = require('./models')

function verifyWebhook(rawBody, signature, secret) {
  if (!(typeof rawBody === 'string' || Buffer.isBuffer(rawBody)) || !rawBody.length || typeof signature !== 'string' || typeof secret !== 'string' || !secret) return false
  if (!/^[0-9a-f]{64}$/i.test(signature.trim())) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(String(signature).trim().toLowerCase(), 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function parseWebhook(rawBody, signature, secret) {
  if (!verifyWebhook(rawBody, signature, secret)) {
    throw new SignatureError('webhook signature verification failed')
  }
  const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody
  const data = JSON.parse(text)
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new SyntaxError('webhook payload must be a JSON object')
  return new WebhookEvent(data)
}

module.exports = { verifyWebhook, parseWebhook }

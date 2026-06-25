'use strict'

// anore — official Node.js SDK (zero dependencies, Node 18+).
//
//   const { AnoreClient, verifyWebhook } = require('anore-pay')
//   const anore = new AnoreClient({ apiKey: 'an_live_xxx' })
//   const p = await anore.createPayment({ amount: 1500, description: 'Подписка Pro' })
//   // redirect the customer to p.paymentUrl

const { AnoreClient, DEFAULT_BASE_URL } = require('./src/client')
const { verifyWebhook, parseWebhook } = require('./src/webhooks')
const { Payment, WebhookEvent } = require('./src/models')
const {
  AnoreError,
  APIError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  APIConnectionError,
  SignatureError,
} = require('./src/errors')

module.exports = {
  AnoreClient,
  DEFAULT_BASE_URL,
  verifyWebhook,
  parseWebhook,
  Payment,
  WebhookEvent,
  AnoreError,
  APIError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  APIConnectionError,
  SignatureError,
}

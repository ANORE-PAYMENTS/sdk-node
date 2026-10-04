'use strict'

const assert = require('node:assert/strict')
const { test } = require('node:test')
const http = require('node:http')
const crypto = require('node:crypto')
const {
  AnoreClient, DEFAULT_BASE_URL, APIError, APIConnectionError, ValidationError,
  ServerError, SignatureError, verifyWebhook, parseWebhook, Balance, PayoutFees,
  PayoutRates, Payout,
} = require('..')

async function fixture(t, handler) {
  const calls = []
  const server = http.createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const call = { method: req.method, path: req.url, headers: req.headers, raw: Buffer.concat(chunks) }
    calls.push(call)
    handler(call, res, calls.length)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => {
    server.close(resolve)
    server.closeAllConnections()
  }))
  const origin = `http://127.0.0.1:${server.address().port}`
  return { calls, origin, client: new AnoreClient({ apiKey: 'fixture-key', secret: 'fixture-secret', baseUrl: origin, maxRetries: 1 }) }
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'X-Request-Id': 'fixture-request' })
  res.end(JSON.stringify(data))
}

test('current API creation sends email, callback URL, currency and method aliases, signed over exact UTF-8 bytes', async t => {
  const { client, calls } = await fixture(t, (call, res) => json(res, 200, { success: true, id: 'invoice', paymentUrl: 'https://pay.anore.cc/invoice' }))
  const payment = await client.createPayment({ amount: 12.34, description: 'Оплата заказа', shopId: 7, orderId: '42', currency: 'usd', methods: ['card', 'crypto-old'], email: 'customer@example.test', callbackUrl: 'https://merchant.example/hook', getbackUrl: 'https://merchant.example/back', successUrl: 'https://merchant.example/ok', failUrl: 'https://merchant.example/fail' })
  assert.equal(payment.id, 'invoice')
  assert.equal(calls[0].path, '/api/v1/payments')
  assert.equal(calls[0].headers.authorization, 'Bearer fixture-key')
  assert.deepEqual(JSON.parse(calls[0].raw), { amount: 12.34, description: 'Оплата заказа', orderId: '42', shopId: 7, currency: 'usd', methods: ['card', 'crypto-old'], getbackurl: 'https://merchant.example/back', successurl: 'https://merchant.example/ok', failurl: 'https://merchant.example/fail', callbackUrl: 'https://merchant.example/hook', email: 'customer@example.test' })
  assert.equal(calls[0].headers['x-zpay-signature'], crypto.createHmac('sha256', 'fixture-secret').update(calls[0].raw).digest('hex'))
})

test('default, legacy, canonical, origin and proxy API bases do not duplicate paths', async t => {
  assert.equal(DEFAULT_BASE_URL, 'https://api.anore.cc/api/v1')
  const { origin, calls } = await fixture(t, (call, res) => json(res, 200, { id: 'test', paid: true, status: 'paid' }))
  for (const suffix of ['', '/', '/api', '/api/v1/', '/v1/', '/proxy/api/']) {
    const client = new AnoreClient({ apiKey: 'key', baseUrl: origin + suffix })
    await client.getPayment('a/b?c')
  }
  assert.deepEqual(calls.map(call => call.path), ['/api/v1/payments/a%2Fb%3Fc', '/api/v1/payments/a%2Fb%3Fc', '/api/v1/payments/a%2Fb%3Fc', '/api/v1/payments/a%2Fb%3Fc', '/v1/payments/a%2Fb%3Fc', '/proxy/api/payments/a%2Fb%3Fc'])
})

test('list pagination and filters are encoded and typed payment models remain iterable', async t => {
  const { client, calls } = await fixture(t, (call, res) => json(res, 200, { success: true, shopId: 7, limit: 20, offset: 40, total: 80, payments: [{ id: 'first', status: 'paid', paid: true, currency: 'USD', currencyRate: 88 }] }))
  const page = await client.listPayments({ shopId: 7, status: 'paid', from: '2026-10-01', to: '2026-10-03', limit: 20, offset: 40 })
  assert.equal(calls[0].path, '/api/v1/payments?limit=20&offset=40&shopId=7&status=paid&from=2026-10-01&to=2026-10-03')
  assert.equal(page.total, 80)
  assert.equal([...page][0].currencyRate, 88)
})

test('balance, fees, rates and payout status support shop-scoped endpoints', async t => {
  const { client, calls } = await fixture(t, (call, res) => json(res, 200, { id: 'WD-42', currency: 'RUB' }))
  assert.ok(await client.getBalance({ shopId: 7 }) instanceof Balance)
  assert.ok(await client.getPayoutFees({ shopId: 7 }) instanceof PayoutFees)
  assert.ok(await client.getPayoutRates({ shopId: 7 }) instanceof PayoutRates)
  assert.ok(await client.getPayout('WD-42') instanceof Payout)
  assert.deepEqual(calls.map(call => call.path), ['/api/v1/balance?shopId=7', '/api/v1/payouts/fees?shopId=7', '/api/v1/payouts/rates?shopId=7', '/api/v1/payouts/WD-42'])
})

test('ERC20 payout creation retains bank and merchant reference fields', async t => {
  const { client, calls } = await fixture(t, (call, res) => json(res, 200, { id: 'WD-42', method: 'usdt_erc20', ratePolicy: 'approval', quoteType: 'estimate' }))
  const payout = await client.createPayout({ amount: 5000, method: 'usdt_erc20', address: '0x123', externalId: 'merchant-42', shopId: 7, bank: 'example' })
  assert.equal(payout.ratePolicy, 'approval')
  assert.equal(payout.quoteType, 'estimate')
  assert.deepEqual(JSON.parse(calls[0].raw), { amount: 5000, method: 'usdt_erc20', address: '0x123', shopId: 7, bank: 'example', externalId: 'merchant-42' })
})

test('GET retries server errors and successful response body remains available', async t => {
  const { client, calls } = await fixture(t, (call, res, count) => json(res, count === 1 ? 503 : 200, count === 1 ? { error: 'busy' } : { id: 'ok' }))
  assert.equal((await client.getPayment('ok')).id, 'ok')
  assert.equal(calls.length, 2)
})

for (const operation of ['payment', 'payout']) {
  test(`${operation} POST never retries after a server error`, async t => {
    const { client, calls } = await fixture(t, (call, res) => json(res, 503, { error: 'busy' }))
    const request = operation === 'payment' ? client.createPayment({ amount: 1, description: 'test' }) : client.createPayout({ amount: 5000, method: 'card', address: 'card' })
    await assert.rejects(request, ServerError)
    assert.equal(calls.length, 1)
  })
  test(`${operation} POST never retries after an uncertain connection failure`, async t => {
    const { client, calls } = await fixture(t, (call, res) => res.destroy())
    const request = operation === 'payment' ? client.createPayment({ amount: 1, description: 'test' }) : client.createPayout({ amount: 5000, method: 'card', address: 'card' })
    await assert.rejects(request, APIConnectionError)
    assert.equal(calls.length, 1)
  })
}

test('validation errors preserve HTTP status and request ID without retry', async t => {
  const { client, calls } = await fixture(t, (call, res) => json(res, 400, { message: 'invalid email' }))
  await assert.rejects(client.createPayment({ amount: 1, description: 'test' }), error => error instanceof ValidationError && error.status === 400 && error.requestId === 'fixture-request')
  assert.equal(calls.length, 1)
})

for (const payload of ['<html>proxy error</html>', '[]', 'null', '']) {
  test(`a successful response with invalid object ${JSON.stringify(payload)} is rejected`, async t => {
    const { client, calls } = await fixture(t, (call, res) => { res.writeHead(200); res.end(payload) })
    await assert.rejects(client.createPayment({ amount: 1, description: 'test' }), APIError)
    assert.equal(calls.length, 1)
  })
}

test('redirects are rejected without forwarding the API key', async t => {
  const { client, calls } = await fixture(t, (call, res) => { res.writeHead(302, { Location: '/captured' }); res.end() })
  await assert.rejects(client.getPayment('test'), error => error instanceof APIError && error.status === 302)
  assert.equal(calls.length, 1)
})

test('timeout covers body reads, not only response headers', async t => {
  const { origin, calls } = await fixture(t, (call, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.write('{') })
  const client = new AnoreClient({ apiKey: 'key', baseUrl: origin, timeout: 30, maxRetries: 0 })
  await assert.rejects(client.createPayment({ amount: 1, description: 'test' }), APIConnectionError)
  assert.equal(calls.length, 1)
})

test('models expose per-method limits, fee arrays, fixing and manual correction revisions', () => {
  const limits = { card_rub: 3000, usdt_erc20: 500 }
  const fees = [{ method: 'usdt_erc20', flatRub: 240, percentAbove: 1, surchargeRub: 0 }]
  const balance = new Balance({ minAmountByMethod: limits, maxAmountByMethod: { usdt_erc20: 1500000 }, rateBasis: 'fixed_0900_msk', rapiraFixing: '09:00 Europe/Moscow' })
  assert.equal(balance.minAmountByMethod.card_rub, 3000)
  assert.equal(balance.maxAmountByMethod.usdt_erc20, 1500000)
  assert.equal(balance.rateBasis, 'fixed_0900_msk')
  assert.equal(balance.rapiraFixing, '09:00 Europe/Moscow')
  const policy = new PayoutFees({ methods: fees, minAmountRubByMethod: limits, maxAmountRubByMethod: limits })
  assert.deepEqual(policy.methods, fees)
  assert.deepEqual(policy.minAmountRubByMethod, limits)
  assert.deepEqual(policy.maxAmountRubByMethod, limits)
  const rates = new PayoutRates({ fees, rateBasis: 'fixed_0900_msk', sbpRatePolicy: 'execution' })
  assert.deepEqual(rates.fees, fees)
  assert.equal(rates.sbpRatePolicy, 'execution')
  const payout = new Payout({ methodCode: 'usdt_erc20', manualCorrection: true, statusRevision: 2, quoteAppliedAt: '2026-10-03T09:00:00Z', rateBasis: 'fixed_0900_msk' })
  assert.equal(payout.method, 'usdt_erc20')
  assert.equal(payout.statusRevision, 2)
  assert.equal(payout.manualCorrection, true)
  assert.equal(payout.quoteAppliedAt, '2026-10-03T09:00:00Z')
})

test('webhooks verify exact bytes before JSON parsing and handle payout.updated revisions', () => {
  const raw = Buffer.from('{"event":"payout.updated", "id":"WD-42","status":"pending","manualCorrection":true,"statusRevision":2,"description":"Заказ"}')
  const signature = crypto.createHmac('sha256', 'secret').update(raw).digest('hex')
  assert.equal(verifyWebhook(raw, signature.toUpperCase(), 'secret'), true)
  assert.equal(verifyWebhook(Buffer.from(JSON.stringify(JSON.parse(raw))), signature, 'secret'), false)
  const event = parseWebhook(raw, signature, 'secret')
  assert.equal(event.isPayout, true)
  assert.equal(event.isSucceeded, false)
  assert.equal(event.statusRevision, 2)
  assert.equal(event.manualCorrection, true)
  assert.throws(() => parseWebhook(raw, signature, 'other-secret'), SignatureError)
  assert.equal(verifyWebhook(raw, '☃', 'secret'), false)
  assert.equal(verifyWebhook({}, signature, 'secret'), false)
  const array = '[]'
  const arraySig = crypto.createHmac('sha256', 'secret').update(array).digest('hex')
  assert.throws(() => parseWebhook(array, arraySig, 'secret'), SyntaxError)
})

test('invalid amounts and retry configurations fail before networking', async () => {
  const client = new AnoreClient({ apiKey: 'key' })
  for (const amount of [NaN, Infinity, -1, 0, true, '1']) {
    await assert.rejects(client.createPayment({ amount, description: 'test' }))
    await assert.rejects(client.createPayout({ amount, method: 'card', address: 'card' }))
  }
  assert.throws(() => new AnoreClient({ apiKey: 'key', maxRetries: -1 }))
  assert.throws(() => new AnoreClient({ apiKey: 'key', timeout: 0 }))
  assert.throws(() => new AnoreClient({ apiKey: 'key', baseUrl: 'https://key@example.com' }))
})

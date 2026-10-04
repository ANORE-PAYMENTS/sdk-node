# anore — Node.js SDK

Официальный SDK для приёма платежей через [anore](https://anore.cc). Без зависимостей, Node.js 18+.

## Структура

```
nodejs/
├── index.js          точка входа (экспорт)
├── index.d.ts        TypeScript-типы
└── src/
    ├── client.js     AnoreClient — платежи, баланс и выплаты
    ├── transport.js  HTTP с ретраями/бэкоффом
    ├── webhooks.js   verifyWebhook / parseWebhook
    ├── models.js     модели ответов API и вебхуков
    └── errors.js     иерархия ошибок
```

## Установка

Скопируйте папку `nodejs/` в проект и подключите, либо `npm install ./nodejs`.

```js
const { AnoreClient, parseWebhook } = require('anore-pay')
```

## Быстрый старт

```js
const anore = new AnoreClient({ apiKey: 'an_live_xxxxxxxxxxxxxxxx' })

// 1. создать счёт
const payment = await anore.createPayment({
  amount: 1500,
  description: 'Подписка Pro',
  orderId: 'order_42',
  shopId: 1, // обязателен для аккаунтовых ключей (an_live_ / an_test_)
})
console.log(payment.paymentUrl) // отправьте клиента сюда

// 2. проверить статус
const status = await anore.getPayment(payment.id)
console.log(status.status, status.paid) // 'paid', true

// 3. список платежей и баланс
const page = await anore.listPayments({ shopId: 1, status: 'paid', limit: 20 })
const balance = await anore.getBalance({ shopId: 1 })

// 4. выплата
const payout = await anore.createPayout({
  amount: 5000,
  method: 'usdt_ton',
  address: 'UQ...',
  shopId: 1,
  externalId: 'payout_42',
})
console.log(payout.id, payout.status)
```

## Проверка вебхука

При оплате anore шлёт `POST` на ваш URL с заголовком `Anore-Signature`.
Проверяйте подпись по **сырому** телу запроса (не распарсенному JSON):

Тот же обработчик принимает `payout.created`, `payout.processing`, `payout.succeeded`, `payout.failed` и `payout.updated` (ручная корректировка статуса, см. `statusRevision`); у события выплаты `event.isPayout === true`.

```js
const express = require('express')
const { parseWebhook, SignatureError } = require('anore-pay')

const app = express()
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
  try {
    const event = parseWebhook(req.body, req.headers['anore-signature'], process.env.ANORE_WEBHOOK_SECRET)
    if (event.isSucceeded) {
      // отгрузить заказ event.id / event.orderId
    }
    res.json({ ok: true })
  } catch (e) {
    if (e instanceof SignatureError) return res.status(403).end()
    throw e
  }
})
```

## Обработка ошибок

```js
const { AnoreClient, ValidationError, AuthenticationError, APIConnectionError } = require('anore-pay')
try {
  await anore.createPayment({ amount: 1500, description: 'Заказ' })
} catch (e) {
  if (e instanceof ValidationError) { /* 400 — кривой запрос */ }
  else if (e instanceof AuthenticationError) { /* 401 — неверный ключ */ }
  else if (e instanceof APIConnectionError) { /* сеть недоступна */ }
}
```

## Справка

| API | Описание |
|-----|----------|
| `new AnoreClient({ apiKey, secret?, baseUrl?, timeout?, maxRetries? })` | клиент; `secret` подписывает исходящие запросы |
| `createPayment({ amount, description, orderId?, shopId?, currency?, methods?, getbackUrl?, successUrl?, failUrl? })` | создать счёт → `Payment` |
| `getPayment(id)` | статус → `Payment` (`.status`, `.paid`) |
| `listPayments({ shopId?, status?, from?, to?, limit?, offset? })` | страница платежей → `PaymentList` |
| `getBalance({ shopId? })` | баланс → `Balance` |
| `getPayoutFees({ shopId? })` | комиссии → `PayoutFees` |
| `getPayoutRates({ shopId? })` | курсы → `PayoutRates` |
| `createPayout({ amount, method, address, shopId?, bank?, externalId? })` | заявка → `Payout` |
| `getPayout(id)` | статус выплаты → `Payout` |
| `verifyWebhook(rawBody, signature, secret)` | проверка подписи → `boolean` |
| `parseWebhook(rawBody, signature, secret)` | проверка + разбор → `WebhookEvent` (бросает `SignatureError`) |

Ошибки: `ValidationError` (400), `AuthenticationError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ServerError` (5xx), `APIConnectionError` (сеть), `SignatureError` (подпись).

Полная документация: https://anore.cc/docs

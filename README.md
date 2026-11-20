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
  userIdentity: {
    type: 'telegram_id',
    value: '123456789',
    telegramUsername: '@customer_name',
  },
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

## Identity и франшиза

`userIdentity` сейчас может быть необязательным для конкретной кассы, но скоро станет обязательным. Передавайте его уже сейчас. Поддерживаются `telegram_id`, `email`, `username`, `external_id`; `telegramUsername` разрешён только с `telegram_id` и не участвует в matching. Telegram ID сопоставляется глобально, остальные типы — только внутри исходной кассы.

```js
await anore.createPayment({
  amount: 1500,
  description: 'Заказ филиала',
  userIdentity: { type: 'email', value: 'buyer@example.com' },
  franchise: {
    type: 'website',
    address: 'https://branch.example.com',
    ownerTelegramId: '987654321',
    ownerTelegramUsername: 'branch_owner',
  },
})
```

`franchise` обязателен при включённом franchise mode и запрещён при выключенном. Оба объекта принадлежат только ANORE, не пересылаются Payso и не возвращаются в публичных responses/webhooks/logs/exports.

## Рекуррентные платежи

```js
const catalog = await anore.getSubscriptionCatalog()
const binding = await anore.createSubscription({
  planId: catalog.shops[0].plans[0].planId,
  customerId: 'customer-42',
  customerEmail: 'buyer@example.com',
  idempotencyKey: 'binding-customer-42',
  shopId: 1,
})
```

Subscription POST никогда не повторяется SDK автоматически. При `503 binding_reconciling` используйте `error.data.subscriptionId` для безопасного `getSubscription(id)` polling; сохраните тот же ключ и body, не отправляйте новый POST и не создавайте новый ключ.

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
| `createPayment({ amount, description, ..., userIdentity?, franchise? })` | создать счёт → `Payment`; identity скоро станет обязательным, franchise зависит от режима кассы |
| `getPayment(id)` | статус → `Payment` (`.status`, `.paid`) |
| `listPayments({ shopId?, status?, from?, to?, limit?, offset? })` | страница платежей → `PaymentList` |
| `getSubscriptionCatalog()` | доступные кассы и планы → `SubscriptionCatalog` |
| `createSubscription({ planId, customerId, customerEmail, idempotencyKey, shopId? })` | QR привязки → `SubscriptionBinding` |
| `chargeSubscription(id, { idempotencyKey })` | начать списание → `SubscriptionCharge` |
| `getSubscription(id)` | безопасный статус → `SubscriptionStatus` |
| `getBalance({ shopId? })` | баланс → `Balance` |
| `getPayoutFees({ shopId? })` | комиссии → `PayoutFees` |
| `getPayoutRates({ shopId? })` | курсы → `PayoutRates` |
| `listPayouts({ shopId?, limit?, cursor? })` | история выплат → `PayoutList` |
| `createPayout({ amount, method, address, shopId?, bank?, externalId? })` | заявка → `Payout` |
| `getPayout(id)` | статус выплаты → `Payout` |
| `verifyWebhook(rawBody, signature, secret)` | проверка подписи → `boolean` |
| `parseWebhook(rawBody, signature, secret)` | проверка + разбор → `WebhookEvent` (бросает `SignatureError`) |

Ошибки: `ValidationError` (400), `AuthenticationError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ServerError` (5xx), `APIConnectionError` (сеть), `SignatureError` (подпись).

Полная документация: https://anore.cc/docs

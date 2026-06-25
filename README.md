# anore — Node.js SDK

Официальный SDK для приёма платежей через [anore](https://anore.cc). Без зависимостей, Node.js 18+.

## Структура

```
nodejs/
├── index.js          точка входа (экспорт)
├── index.d.ts        TypeScript-типы
└── src/
    ├── client.js     AnoreClient — создание платежа, статус
    ├── transport.js  HTTP с ретраями/бэкоффом
    ├── webhooks.js   verifyWebhook / parseWebhook
    ├── models.js     Payment, WebhookEvent
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
```

## Проверка вебхука

При оплате anore шлёт `POST` на ваш URL с заголовком `Anore-Signature`.
Проверяйте подпись по **сырому** телу запроса (не распарсенному JSON):

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
| `createPayment({ amount, description, orderId?, shopId? })` | создать счёт → `Payment` |
| `getPayment(id)` | статус → `Payment` (`.status`, `.paid`) |
| `verifyWebhook(rawBody, signature, secret)` | проверка подписи → `boolean` |
| `parseWebhook(rawBody, signature, secret)` | проверка + разбор → `WebhookEvent` (бросает `SignatureError`) |

Ошибки: `ValidationError` (400), `AuthenticationError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ServerError` (5xx), `APIConnectionError` (сеть), `SignatureError` (подпись).

Полная документация: https://anore.cc/docs

import {
  AnoreClient,
  Franchise,
  UserIdentity,
} from '.'

const identity: UserIdentity = {
  type: 'telegram_id',
  value: '123456789',
  telegramUsername: '@customer_name',
}
const franchise: Franchise = {
  type: 'website',
  address: 'https://branch.example.com',
  ownerTelegramId: '987654321',
}
const client = new AnoreClient({ apiKey: 'fixture' })
void client.createPayment({ amount: 10, description: 'order', userIdentity: identity, franchise })
void client.createSubscription({
  planId: 'plan',
  customerId: 'customer',
  customerEmail: 'buyer@example.com',
  idempotencyKey: 'binding-key',
})
void client.chargeSubscription(1, { idempotencyKey: 'charge-key' })
void client.getSubscription(1)
void client.listPayouts({ limit: 25 })

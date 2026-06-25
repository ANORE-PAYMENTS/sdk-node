'use strict'

// Error hierarchy for the anore SDK.
//
//   AnoreError                  — base for everything the SDK throws
//   ├─ APIError                 — the API returned a non-2xx response
//   │  ├─ ValidationError       — 400
//   │  ├─ AuthenticationError   — 401
//   │  ├─ ForbiddenError        — 403
//   │  ├─ NotFoundError         — 404
//   │  └─ ServerError           — 5xx
//   ├─ APIConnectionError       — network failure / timeout (after retries)
//   └─ SignatureError           — webhook signature verification failed

class AnoreError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
  }
}

class APIError extends AnoreError {
  constructor(message, { status = 0, data = null, requestId = null } = {}) {
    super(message)
    this.status = status
    this.data = data || {}
    this.requestId = requestId
  }
}

class ValidationError extends APIError {}      // 400
class AuthenticationError extends APIError {}  // 401
class ForbiddenError extends APIError {}       // 403
class NotFoundError extends APIError {}        // 404
class ServerError extends APIError {}          // 5xx

class APIConnectionError extends AnoreError {} // network / timeout
class SignatureError extends AnoreError {}     // bad webhook signature

// Map an HTTP status to the most specific APIError subclass.
function errorForStatus(status, message, opts) {
  const map = {
    400: ValidationError,
    401: AuthenticationError,
    403: ForbiddenError,
    404: NotFoundError,
  }
  const Cls = map[status] || (status >= 500 ? ServerError : APIError)
  return new Cls(message, { status, ...opts })
}

module.exports = {
  AnoreError,
  APIError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  APIConnectionError,
  SignatureError,
  errorForStatus,
}

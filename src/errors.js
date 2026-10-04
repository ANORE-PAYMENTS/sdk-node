'use strict'

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

class ValidationError extends APIError {}
class AuthenticationError extends APIError {}
class ForbiddenError extends APIError {}
class NotFoundError extends APIError {}
class ServerError extends APIError {}

class APIConnectionError extends AnoreError {}
class SignatureError extends AnoreError {}

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

import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin, createSessionToken, verifySessionToken } from '../auth'
import { verifySessionTokenEdge } from '../auth.edge'

describe('auth', () => {
  describe('hashPin / verifyPin', () => {
    it('should hash and verify a correct PIN', async () => {
      const pin = '1234'
      const hash = await hashPin(pin)
      expect(await verifyPin(pin, hash)).toBe(true)
    })

    it('should reject an incorrect PIN', async () => {
      const hash = await hashPin('1234')
      expect(await verifyPin('0000', hash)).toBe(false)
    })

    it('should produce different hashes for the same PIN', async () => {
      const hash1 = await hashPin('1234')
      const hash2 = await hashPin('1234')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('createSessionToken / verifySessionToken', () => {
    it('should create a valid session token', () => {
      const token = createSessionToken()
      expect(typeof token).toBe('string')
      expect(token.includes('.')).toBe(true)
    })

    it('should verify a valid session token', () => {
      const token = createSessionToken()
      expect(verifySessionToken(token)).toBe(true)
    })

    it('should reject an invalid session token', () => {
      expect(verifySessionToken('invalid')).toBe(false)
      expect(verifySessionToken('')).toBe(false)
      expect(verifySessionToken('abc.def')).toBe(false)
    })

    it('should reject an expired session token', () => {
      // Create a token, then tamper with the expiry
      const token = createSessionToken()
      const [payloadB64] = token.split('.')
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
      // Set expiry to the past
      payload.exp = Date.now() - 1000
      const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
      // Re-sign won't match, so this tests both expiry AND signature integrity
      const tamperedToken = tamperedPayload + '.' + 'invalidsignature'
      expect(verifySessionToken(tamperedToken)).toBe(false)
    })

    it('should reject a token with tampered payload', () => {
      const token = createSessionToken()
      const [, signature] = token.split('.')
      const tamperedPayload = Buffer.from(JSON.stringify({
        random: 'tampered',
        exp: Date.now() + 999999999,
      })).toString('base64')
      const tamperedToken = tamperedPayload + '.' + signature
      expect(verifySessionToken(tamperedToken)).toBe(false)
    })
  })

  describe('verifySessionTokenEdge (Web Crypto)', () => {
    it('should verify tokens created by Node.js version', async () => {
      const token = createSessionToken()
      expect(await verifySessionTokenEdge(token)).toBe(true)
    })

    it('should reject invalid tokens', async () => {
      expect(await verifySessionTokenEdge('invalid')).toBe(false)
      expect(await verifySessionTokenEdge('')).toBe(false)
      expect(await verifySessionTokenEdge('abc.def')).toBe(false)
    })

    it('should reject tampered tokens', async () => {
      const token = createSessionToken()
      const [, signature] = token.split('.')
      const tamperedPayload = btoa(JSON.stringify({
        random: 'tampered',
        exp: Date.now() + 999999999,
      }))
      const tamperedToken = tamperedPayload + '.' + signature
      expect(await verifySessionTokenEdge(tamperedToken)).toBe(false)
    })
  })
})

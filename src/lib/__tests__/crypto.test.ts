import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, isEncrypted } from '../crypto'

describe('crypto', () => {
  describe('encrypt / decrypt', () => {
    it('round-trips a plain string', () => {
      const plaintext = 'sk-ant-api03-secret-key'
      const ciphertext = encrypt(plaintext)
      expect(decrypt(ciphertext)).toBe(plaintext)
    })

    it('produces a different ciphertext each call (random IV)', () => {
      const value = 'same-value'
      expect(encrypt(value)).not.toBe(encrypt(value))
    })

    it('decrypts correctly after multiple round-trips', () => {
      const values = ['short', 'a'.repeat(1000), '🔑 unicode key 🗝️']
      for (const v of values) {
        expect(decrypt(encrypt(v))).toBe(v)
      }
    })

    it('throws on tampered ciphertext', () => {
      const ct = encrypt('secret')
      const parts = ct.split(':')
      parts[2] = parts[2].slice(0, -2) + 'ff' // corrupt last byte
      expect(() => decrypt(parts.join(':'))).toThrow()
    })

    it('throws on invalid format', () => {
      expect(() => decrypt('not-valid')).toThrow()
      expect(() => decrypt('a:b')).toThrow()
    })
  })

  describe('isEncrypted', () => {
    it('returns true for encrypted values', () => {
      expect(isEncrypted(encrypt('anything'))).toBe(true)
    })

    it('returns false for plaintext API keys', () => {
      expect(isEncrypted('sk-ant-api03-plaintext')).toBe(false)
      expect(isEncrypted('')).toBe(false)
      expect(isEncrypted('short')).toBe(false)
    })
  })
})

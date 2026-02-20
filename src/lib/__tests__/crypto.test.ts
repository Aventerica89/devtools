import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encrypt, decrypt, isEncrypted } from '../crypto'

describe('crypto', () => {
  const originalEnv = process.env.SESSION_SECRET

  beforeEach(() => {
    // Ensure SESSION_SECRET is set for tests
    if (!process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = 'test-secret-key-for-encryption-at-least-32-bytes-long'
    }
  })

  afterEach(() => {
    process.env.SESSION_SECRET = originalEnv
  })

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

    it('throws on tampered auth tag', () => {
      const ct = encrypt('secret')
      const parts = ct.split(':')
      parts[1] = parts[1].slice(0, -2) + 'aa' // corrupt auth tag
      expect(() => decrypt(parts.join(':'))).toThrow()
    })

    it('throws on tampered IV', () => {
      const ct = encrypt('secret')
      const parts = ct.split(':')
      parts[0] = parts[0].slice(0, -2) + 'bb' // corrupt IV
      expect(() => decrypt(parts.join(':'))).toThrow()
    })

    it('handles empty strings', () => {
      const ciphertext = encrypt('')
      expect(decrypt(ciphertext)).toBe('')
    })

    it('handles special characters', () => {
      const plaintext = 'test!@#$%^&*()_+={}[]|\\:";\'<>,.?/~`'
      const ciphertext = encrypt(plaintext)
      expect(decrypt(ciphertext)).toBe(plaintext)
    })

    it('handles very long strings', () => {
      const plaintext = 'a'.repeat(50000)
      const ciphertext = encrypt(plaintext)
      expect(decrypt(ciphertext)).toBe(plaintext)
    })

    it('produces ciphertext in expected format', () => {
      const ciphertext = encrypt('test')
      const parts = ciphertext.split(':')
      expect(parts).toHaveLength(3)
      // IV should be 24 hex chars (12 bytes)
      expect(parts[0]).toMatch(/^[0-9a-f]{24}$/)
      // Auth tag should be 32 hex chars (16 bytes)
      expect(parts[1]).toMatch(/^[0-9a-f]{32}$/)
      // Ciphertext should be hex
      expect(parts[2]).toMatch(/^[0-9a-f]+$/)
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

    it('returns false for malformed encrypted strings', () => {
      expect(isEncrypted('part1:part2')).toBe(false)
      expect(isEncrypted('a:b:c')).toBe(false) // wrong lengths
      expect(isEncrypted('short:alsoshort:data')).toBe(false)
    })

    it('validates correct IV and tag lengths', () => {
      // Correct lengths: IV=24 hex chars, tag=32 hex chars
      const validFormat = 'a'.repeat(24) + ':' + 'b'.repeat(32) + ':ciphertext'
      expect(isEncrypted(validFormat)).toBe(true)

      // Wrong IV length
      const wrongIV = 'a'.repeat(20) + ':' + 'b'.repeat(32) + ':ciphertext'
      expect(isEncrypted(wrongIV)).toBe(false)

      // Wrong tag length
      const wrongTag = 'a'.repeat(24) + ':' + 'b'.repeat(28) + ':ciphertext'
      expect(isEncrypted(wrongTag)).toBe(false)
    })

    it('handles edge cases', () => {
      expect(isEncrypted(':')).toBe(false)
      expect(isEncrypted('::')).toBe(false)
      expect(isEncrypted(':::')).toBe(false)
    })
  })

  describe('security', () => {
    it('different secrets produce different ciphertexts', () => {
      const plaintext = 'test-value'

      process.env.SESSION_SECRET = 'secret-one-for-testing-purposes-at-least-32'
      const ct1 = encrypt(plaintext)

      process.env.SESSION_SECRET = 'secret-two-for-testing-purposes-at-least-32'
      const ct2 = encrypt(plaintext)

      expect(ct1).not.toBe(ct2)
    })

    it('cannot decrypt with different secret', () => {
      process.env.SESSION_SECRET = 'secret-one-for-testing-purposes-at-least-32'
      const ciphertext = encrypt('test')

      process.env.SESSION_SECRET = 'secret-two-for-testing-purposes-at-least-32'
      expect(() => decrypt(ciphertext)).toThrow()
    })
  })
})

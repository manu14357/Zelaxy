import { describe, expect, it } from 'vitest'
import { normalizeSSODomain } from '@/lib/sso/domain'

describe('normalizeSSODomain', () => {
  it('accepts a plain registrable domain', () => {
    expect(normalizeSSODomain('company.com')).toBe('company.com')
    expect(normalizeSSODomain('sub.company.co.uk')).toBe('sub.company.co.uk')
  })

  it('lowercases and trims input', () => {
    expect(normalizeSSODomain('  Company.COM  ')).toBe('company.com')
  })

  it('extracts the domain from an email address', () => {
    expect(normalizeSSODomain('alice@company.com')).toBe('company.com')
  })

  it('strips protocol, path, query and port', () => {
    expect(normalizeSSODomain('https://company.com/sso?x=1')).toBe('company.com')
    expect(normalizeSSODomain('http://company.com:8443')).toBe('company.com')
  })

  it('strips a wildcard and leading/trailing dots', () => {
    expect(normalizeSSODomain('*.company.com')).toBe('company.com')
    expect(normalizeSSODomain('company.com.')).toBe('company.com')
  })

  it('rejects values without a valid TLD', () => {
    expect(normalizeSSODomain('localhost')).toBeNull()
    expect(normalizeSSODomain('company')).toBeNull()
  })

  it('rejects empty or invalid input', () => {
    expect(normalizeSSODomain('')).toBeNull()
    expect(normalizeSSODomain('   ')).toBeNull()
    expect(normalizeSSODomain(null)).toBeNull()
    expect(normalizeSSODomain(undefined)).toBeNull()
    expect(normalizeSSODomain('not a domain!!')).toBeNull()
  })
})

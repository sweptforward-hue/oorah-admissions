import { describe, it, expect } from 'vitest'
import { validateEnv } from '../src/lib/env'

describe('Runtime Environment Validation (env.ts)', () => {
  const validEnv = {
    NODE_ENV: 'production',
    NEXT_PUBLIC_SUPABASE_URL: 'https://xyzcompany.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'valid-anon-key-12345',
    SUPABASE_SERVICE_ROLE_KEY: 'valid-service-role-key-12345',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: 'sa@project.iam.gserviceaccount.com',
    GOOGLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADAN...\n-----END PRIVATE KEY-----',
    GOOGLE_PROJECT_ID: 'oorah-admissions-prod',
    NEXT_PUBLIC_APP_URL: 'https://admissions.oorah.org',
  }

  it('validates a complete and valid environment configuration successfully', () => {
    const parsed = validateEnv(validEnv, { strict: true })
    expect(parsed.supabaseUrl).toBe('https://xyzcompany.supabase.co')
    expect(parsed.supabaseAnonKey).toBe('valid-anon-key-12345')
    expect(parsed.supabaseServiceRoleKey).toBe('valid-service-role-key-12345')
    expect(parsed.googleServiceAccountEmail).toBe('sa@project.iam.gserviceaccount.com')
    expect(parsed.googleProjectId).toBe('oorah-admissions-prod')
    expect(parsed.appUrl).toBe('https://admissions.oorah.org')
  })

  it('fails closed when NEXT_PUBLIC_SUPABASE_URL is missing or invalid URL', () => {
    expect(() =>
      validateEnv(
        { ...validEnv, NEXT_PUBLIC_SUPABASE_URL: '' },
        { strict: true }
      )
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL is required/)

    expect(() =>
      validateEnv(
        { ...validEnv, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' },
        { strict: true }
      )
    ).toThrow(/must be a valid HTTP\/HTTPS URL/)
  })

  it('fails closed when Supabase keys are missing', () => {
    expect(() =>
      validateEnv(
        { ...validEnv, NEXT_PUBLIC_SUPABASE_ANON_KEY: '' },
        { strict: true }
      )
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY is required/)

    expect(() =>
      validateEnv(
        { ...validEnv, SUPABASE_SERVICE_ROLE_KEY: '' },
        { strict: true }
      )
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY is required/)
  })

  it('fails closed when Google Service Account email is invalid', () => {
    expect(() =>
      validateEnv(
        { ...validEnv, GOOGLE_SERVICE_ACCOUNT_EMAIL: 'invalid-email' },
        { strict: true }
      )
    ).toThrow(/must be a valid email address/)
  })

  it('fails closed when Google Private Key or Project ID is missing', () => {
    expect(() =>
      validateEnv(
        { ...validEnv, GOOGLE_PRIVATE_KEY: '' },
        { strict: true }
      )
    ).toThrow(/GOOGLE_PRIVATE_KEY \(or GOOGLE_SERVICE_ACCOUNT_KEY\) is required/)

    expect(() =>
      validateEnv(
        { ...validEnv, GOOGLE_PROJECT_ID: '' },
        { strict: true }
      )
    ).toThrow(/GOOGLE_PROJECT_ID is required/)
  })

  it('fails closed when NEXT_PUBLIC_APP_URL is missing or invalid URL', () => {
    expect(() =>
      validateEnv(
        { ...validEnv, NEXT_PUBLIC_APP_URL: '' },
        { strict: true }
      )
    ).toThrow(/NEXT_PUBLIC_APP_URL \(or APP_URL\) is required/)

    expect(() =>
      validateEnv(
        { ...validEnv, NEXT_PUBLIC_APP_URL: 'ftp://invalid-scheme' },
        { strict: true }
      )
    ).toThrow(/must be a valid HTTP\/HTTPS URL/)
  })
})

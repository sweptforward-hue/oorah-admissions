export interface EnvConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey: string
  googleServiceAccountEmail: string
  googlePrivateKey: string
  googleProjectId: string
  appUrl: string
  nodeEnv: string
}

function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidEmail(emailStr: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)
}

export function validateEnv(
  customEnv?: Record<string, string | undefined>,
  options?: { strict?: boolean }
): EnvConfig {
  const source = customEnv || process.env
  const errors: string[] = []

  const isTest = source.NODE_ENV === 'test'
  const isStrict = options?.strict ?? (!isTest || Boolean(customEnv))

  // 1. Supabase URL
  const supabaseUrl = source.NEXT_PUBLIC_SUPABASE_URL || (isStrict ? '' : 'http://localhost:54321')
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else if (!isValidUrl(supabaseUrl)) {
    errors.push(`NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP/HTTPS URL (got: "${supabaseUrl}")`)
  }

  // 2. Supabase Anon Key
  const supabaseAnonKey = source.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isStrict ? '' : 'public-anon-key')
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // 3. Supabase Service Role Key
  const supabaseServiceRoleKey = source.SUPABASE_SERVICE_ROLE_KEY || (isStrict ? '' : 'service-role-key')
  if (!supabaseServiceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required')
  }

  // 4. Google Service Account Credentials
  const googleEmail = source.GOOGLE_SERVICE_ACCOUNT_EMAIL || source.GOOGLE_CLIENT_EMAIL || (isStrict ? '' : 'service-account@oorah-admissions.iam.gserviceaccount.com')
  if (!googleEmail) {
    errors.push('GOOGLE_SERVICE_ACCOUNT_EMAIL (or GOOGLE_CLIENT_EMAIL) is required')
  } else if (!isValidEmail(googleEmail)) {
    errors.push(`GOOGLE_SERVICE_ACCOUNT_EMAIL must be a valid email address (got: "${googleEmail}")`)
  }

  const googlePrivateKey = source.GOOGLE_PRIVATE_KEY || source.GOOGLE_SERVICE_ACCOUNT_KEY || (isStrict ? '' : '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n')
  if (!googlePrivateKey) {
    errors.push('GOOGLE_PRIVATE_KEY (or GOOGLE_SERVICE_ACCOUNT_KEY) is required')
  }

  const googleProjectId = source.GOOGLE_PROJECT_ID || (isStrict ? '' : 'oorah-admissions-prod')
  if (!googleProjectId) {
    errors.push('GOOGLE_PROJECT_ID is required')
  }

  // 5. App URL
  const appUrl = source.NEXT_PUBLIC_APP_URL || source.APP_URL || (isStrict ? '' : 'http://localhost:3000')
  if (!appUrl) {
    errors.push('NEXT_PUBLIC_APP_URL (or APP_URL) is required')
  } else if (!isValidUrl(appUrl)) {
    errors.push(`NEXT_PUBLIC_APP_URL must be a valid HTTP/HTTPS URL (got: "${appUrl}")`)
  }

  if (errors.length > 0) {
    const errorMsg = `Runtime Environment Validation Failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    throw new Error(errorMsg)
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    googleServiceAccountEmail: googleEmail,
    googlePrivateKey,
    googleProjectId,
    appUrl,
    nodeEnv: source.NODE_ENV || 'development',
  }
}

let cachedEnv: EnvConfig | null = null

export function getEnv(options?: { strict?: boolean }): EnvConfig {
  if (!cachedEnv || options?.strict) {
    cachedEnv = validateEnv(undefined, options)
  }
  return cachedEnv
}

export const env = getEnv()

export type CookieCategory = 'necessary' | 'analytics' | 'performance' | 'marketing'

export interface ConsentPreferences {
  // Always true; shown for completeness in UI but cannot be disabled
  necessary: true
  analytics: boolean
  performance: boolean
  marketing: boolean
}

export interface ConsentState {
  version: number
  updatedAt: string // ISO string
  preferences: ConsentPreferences
}

export const CONSENT_COOKIE_NAME = 'z3st_consent'
export const CONSENT_COOKIE_MAX_AGE_DAYS = 180 // 6 months

export const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  necessary: true,
  analytics: false,
  performance: false,
  marketing: false,
}

export function createConsentState(prefs?: Partial<ConsentPreferences>): ConsentState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    preferences: { ...DEFAULT_CONSENT_PREFERENCES, ...prefs },
  }
}

export function parseConsentCookie(value: string | null | undefined): ConsentState | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as ConsentState
    if (!parsed || typeof parsed !== 'object') return null
    if (!parsed.preferences) return null
    // Ensure necessary is always true
    parsed.preferences.necessary = true
    return parsed
  } catch {
    return null
  }
}

export function serializeConsentCookie(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state))
}

export function getConsentFromCookieString(cookieString: string): ConsentState | null {
  // Parse a semicolon-delimited cookie header string
  const parts = cookieString.split(';').map((p) => p.trim())
  const match = parts.find((p) => p.startsWith(CONSENT_COOKIE_NAME + '='))
  if (!match) return null
  const value = match.slice(CONSENT_COOKIE_NAME.length + 1)
  return parseConsentCookie(value)
}

export function cookieStringFor(state: ConsentState, secure: boolean = true): string {
  const maxAge = CONSENT_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  const sameSite = 'Lax'
  const cookie = `${CONSENT_COOKIE_NAME}=${serializeConsentCookie(state)}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secure ? '; Secure' : ''}`
  return cookie
}

export function isCategoryAllowed(state: ConsentState | null, category: CookieCategory): boolean {
  if (!state) return category === 'necessary' ? true : false
  if (category === 'necessary') return true
  return !!state.preferences[category]
}

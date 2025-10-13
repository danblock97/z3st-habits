"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  CONSENT_COOKIE_NAME,
  DEFAULT_CONSENT_PREFERENCES,
  createConsentState,
  getConsentFromCookieString,
  cookieStringFor,
  ConsentPreferences,
} from "@/lib/cookie-consent"

function readClientConsent(): ReturnType<typeof getConsentFromCookieString> {
  if (typeof document === "undefined") return null
  return getConsentFromCookieString(document.cookie || "")
}

function writeClientConsent(prefs: ConsentPreferences) {
  const state = createConsentState(prefs)
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:'
  const cookie = cookieStringFor(state, isSecure)
  document.cookie = cookie
}

export function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [customizing, setCustomizing] = useState(false)

  const existing = useMemo(() => readClientConsent(), [])
  const [prefs, setPrefs] = useState<ConsentPreferences>(
    existing?.preferences ?? DEFAULT_CONSENT_PREFERENCES
  )

  // Auto-open on first visit (no consent stored)
  useEffect(() => {
    if (!existing) {
      setOpen(true)
    }
  }, [existing])

  // Allow opening via a global event for a footer/menu trigger
  useEffect(() => {
    const handler = () => {
      const current = readClientConsent()
      if (current) {
        setPrefs(current.preferences)
      }
      setCustomizing(true)
      setOpen(true)
    }
    window.addEventListener("open-cookie-settings", handler as EventListener)
    return () => window.removeEventListener("open-cookie-settings", handler as EventListener)
  }, [])

  const acceptAll = useCallback(() => {
    const next: ConsentPreferences = {
      necessary: true,
      analytics: true,
      performance: true,
      marketing: true,
    }
    writeClientConsent(next)
    setPrefs(next)
    setOpen(false)
  }, [])

  const denyAll = useCallback(() => {
    const next: ConsentPreferences = {
      necessary: true,
      analytics: false,
      performance: false,
      marketing: false,
    }
    writeClientConsent(next)
    setPrefs(next)
    setOpen(false)
  }, [])

  const saveCustom = useCallback(() => {
    // Ensure necessary remains true
    const next: ConsentPreferences = { ...prefs, necessary: true }
    writeClientConsent(next)
    setPrefs(next)
    setOpen(false)
  }, [prefs])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby="cookie-consent-description" showCloseButton={!customizing}>
        <DialogHeader>
          <DialogTitle>Cookie preferences</DialogTitle>
          <DialogDescription id="cookie-consent-description">
            We use cookies to make our site work and to improve your experience. You can accept all cookies, deny non-essential cookies, or customize your preferences. See our {""}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </DialogDescription>
        </DialogHeader>

        {customizing ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Necessary</p>
                <p className="text-xs text-muted-foreground">
                  Required for core site functionality (always on).
                </p>
              </div>
              <Switch checked disabled aria-readonly aria-label="Necessary cookies" />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="analytics" className="text-sm font-medium">Analytics</Label>
                <p className="text-xs text-muted-foreground">
                  Helps us understand usage to improve Z3st.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={prefs.analytics}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, analytics: Boolean(v) }))}
                aria-label="Analytics cookies"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="performance" className="text-sm font-medium">Performance</Label>
                <p className="text-xs text-muted-foreground">
                  Improves speed and reliability insights.
                </p>
              </div>
              <Switch
                id="performance"
                checked={prefs.performance}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, performance: Boolean(v) }))}
                aria-label="Performance cookies"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="marketing" className="text-sm font-medium">Marketing</Label>
                <p className="text-xs text-muted-foreground">
                  Used for personalization and promotions.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={prefs.marketing}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, marketing: Boolean(v) }))}
                aria-label="Marketing cookies"
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          {customizing ? (
            <>
              <Button variant="outline" onClick={() => setCustomizing(false)}>Back</Button>
              <Button onClick={saveCustom}>Save preferences</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={denyAll}>Deny all</Button>
              <Button variant="outline" onClick={() => setCustomizing(true)}>Customize</Button>
              <Button onClick={acceptAll}>Accept all</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Optional: small helper to programmatically open cookie settings from anywhere
export function openCookieSettings() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-cookie-settings'))
  }
}

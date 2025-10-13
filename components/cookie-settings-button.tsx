"use client"

import { Button } from "@/components/ui/button"
import { openCookieSettings } from "@/components/cookie-consent"

export function CookieSettingsButton({ variant = "ghost" }: { variant?: "link" | "ghost" | "outline" | "default" | "secondary" | "destructive" }) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => openCookieSettings()}
      className={variant === 'link' ? undefined : 'px-2 py-1 h-8'}
    >
      Cookie settings
    </Button>
  )
}

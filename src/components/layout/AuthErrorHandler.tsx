'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'

export function AuthErrorHandler() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const searchParams = new URLSearchParams(window.location.search)
    const hashString = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash
    const hashParams = new URLSearchParams(hashString)

    const hasError =
      searchParams.has('error') ||
      searchParams.has('error_code') ||
      hashParams.has('error') ||
      hashParams.has('error_code')

    if (hasError) {
      router.replace('/access-denied')
      return
    }

    // Handle implicit hash tokens globally across all pages
    if (hashParams.get('access_token')) {
      const supabase = createBrowserClient()
      const accessToken = hashParams.get('access_token')!
      const refreshToken = hashParams.get('refresh_token') || ''

      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(({ error }) => {
          if (!error) {
            if (window.history && window.history.replaceState) {
              window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search
              )
            }
            const next = searchParams.get('next') || '/dashboard'
            router.push(next)
            router.refresh()
          }
        })
        .catch(() => {})
    }
  }, [router])

  return null
}

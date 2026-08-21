'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
    }
  }, [router])

  return null
}

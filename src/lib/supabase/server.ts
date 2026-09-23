import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (url: RequestInfo | URL, options?: RequestInit) => {
        const isDefaultLocal = supabaseUrl.includes('localhost:54321')
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), isDefaultLocal ? 1500 : 8000)
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))
      },
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Universal Server Supabase Client.
 * Supports both `await createServerSupabaseClient()` and synchronous invocation
 * by returning a thenable proxy that resolves to the authenticated SupabaseClient.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServerSupabaseClient(): any {
  const clientPromise = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy(clientPromise as unknown as any, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (target as any)[prop].bind(target)
      }
      if (prop === 'auth') {
        return new Proxy({}, {
          get(_aTarget, authProp) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return async (...args: any[]) => {
              const client = await target
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const fn = (client.auth as any)[authProp]
              return typeof fn === 'function' ? fn.apply(client.auth, args) : fn
            }
          }
        })
      }
      if (prop === 'from') {
        return (table: string) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const callChain: Array<{ method: string; args: any[] }> = []

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const makeProxy = (chain: typeof callChain): any => {
            const chainTarget = {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              then(resolve: any, reject: any) {
                target
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .then((client: any) => {
                    let q = client.from(table)
                    for (const call of chain) {
                      q = q[call.method](...call.args)
                    }
                    return q
                  })
                  .then(resolve, reject)
              },
            }

            return new Proxy(chainTarget, {
              get(chTarget, nextMethod) {
                if (nextMethod === 'then' || nextMethod === 'catch' || nextMethod === 'finally') {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return (chTarget as any)[nextMethod]?.bind(chTarget)
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (...nextArgs: any[]) => {
                  chain.push({ method: nextMethod as string, args: nextArgs })
                  return makeProxy(chain)
                }
              },
            })
          }

          return new Proxy({}, {
            get(_t, queryMethod) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (...args: any[]) => {
                callChain.push({ method: queryMethod as string, args })
                return makeProxy(callChain)
              }
            }
          })
        }
      }
      if (prop === 'storage') {
        return {
          from: (bucket: string) => {
            return new Proxy({}, {
              get(_st, stMethod) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return async (...args: any[]) => {
                  const client = await target
                  const b = client.storage.from(bucket)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return (b as any)[stMethod](...args)
                }
              }
            })
          }
        }
      }
      if (prop === 'rpc') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return async (...args: any[]) => {
          const client = await target
          return client.rpc(...args)
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (...args: any[]) => {
        const client = await target
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (client as any)[prop]
        return typeof fn === 'function' ? fn.apply(client, args) : fn
      }
    }
  })
}

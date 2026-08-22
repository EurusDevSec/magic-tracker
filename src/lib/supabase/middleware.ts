import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip session validation for Next.js router prefetch requests to prevent hitting Supabase rate limits (429)
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch'

  if (isPrefetch) {
    return supabaseResponse
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh the session token if it is expired, maintaining active sessions.
  let user = null
  let isRateLimited = false

  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      const errStatus = (authError as any).status
      const errCode = (authError as any).code
      if (errStatus === 429 || errCode === 'over_request_rate_limit' || authError.message?.toLowerCase().includes('rate limit')) {
        isRateLimited = true
      }
    }
    user = authUser
  } catch (err) {
    console.error('[Middleware] Unexpected error in getUser:', err)
  }

  // If rate limited, fall back to getSession to read cookie state locally and avoid redirect loops
  if (isRateLimited) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user = session?.user || null
      console.warn('[Middleware] Supabase rate limit reached (429). Falling back to local cookie getSession(). User status:', !!user)
    } catch (err) {
      console.error('[Middleware] Error in fallback getSession:', err)
    }
  }

  // Protect paths: if there's no user and trying to access private routes, redirect to login
  const protectedPaths = ['/dashboard', '/report', '/magic', '/profile']
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated user away from login/register
  const authPaths = ['/login', '/register']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))
  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

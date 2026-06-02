import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  // If we are on the server side, always create a fresh client for safety (prevents data leaking)
  if (typeof window === 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    return createBrowserClient(url!, key!)
  }

  // If we are in the browser, reuse the existing client instance (Singleton pattern)
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    console.log("[createClient] Initializing singleton browser client with URL:", url);
    browserClient = createBrowserClient(url!, key!)
  }

  return browserClient
}

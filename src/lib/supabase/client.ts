import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient } from './mock-client'

let browserClient: any = null

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  const isMock = !url || !key

  // If we are on the server side, always create a fresh client for safety (prevents data leaking between requests)
  if (typeof window === 'undefined') {
    if (isMock) {
      return createMockSupabaseClient() as any
    }
    return createBrowserClient(url!, key!)
  }

  // If we are in the browser, reuse the existing client instance (Singleton pattern)
  if (!browserClient) {
    if (isMock) {
      console.warn("⚠️ [Supabase] Không tìm thấy URL/Key Supabase. Kích hoạt chế độ MOCK OFFLINE!");
      browserClient = createMockSupabaseClient()
    } else {
      browserClient = createBrowserClient(url!, key!)
    }
  }

  return browserClient
}

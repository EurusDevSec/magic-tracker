'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'member'
  created_at: string
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      setProfile(data as Profile)
    } catch (err) {
      console.error('[AuthContext] Error fetching profile:', err)
      setProfile(null)
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          // Don't await here - let it load in background
          // onAuthStateChange will handle profile fetch
          fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error('[AuthContext] Error getting initial session:', err)
      } finally {
        // Set loading to false immediately after we know the session status
        // Don't wait for fetchProfile to finish - profile can load after
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (session) {
          setUser(session.user)
          // Don't await - fire and forget, profile loads in background
          fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

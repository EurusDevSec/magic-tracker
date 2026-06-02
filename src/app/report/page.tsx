'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navigation from '@/components/Navigation'
import ReportForm from '@/components/ReportForm'
import { Loader2 } from 'lucide-react'

export default function ReportPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950">
      <Navigation />
      
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Báo Cáo Tiến Độ</h1>
          <p className="text-slate-400 text-sm mt-1">Ghi nhận tiến độ công việc hàng ngày của bạn.</p>
        </div>

        <ReportForm />
      </main>
    </div>
  )
}

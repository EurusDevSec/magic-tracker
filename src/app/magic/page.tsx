'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { MAGIC_DAYS } from '@/lib/magic-days'
import { Heart, Lock, Check, Sparkles, Loader2, Award, Calendar } from 'lucide-react'
import Link from 'next/link'

type GratitudeLog = {
  day_number: number
  log_date: string
}

export default function MagicGratitudePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [completedDays, setCompletedDays] = useState<number[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('gratitude_logs')
          .select('day_number, log_date')
          .eq('user_id', user.id)

        if (error) throw error
        
        const days = data?.map(log => log.day_number) || []
        setCompletedDays(days)
      } catch (err) {
        console.error('Error fetching gratitude logs:', err)
      } finally {
        setFetching(false)
      }
    }

    fetchLogs()
  }, [user, supabase])

  // Determine which is the next day they need to complete
  // (e.g. if they have completed 1, 2, next is 3)
  const getNextUnlockableDay = () => {
    for (let d = 1; d <= 28; d++) {
      if (!completedDays.includes(d)) {
        return d
      }
    }
    return 29 // Completed all!
  }

  const nextDay = getNextUnlockableDay()

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-5xl relative">
        {/* Glow Blobs */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" /> The Magic - Phép Màu
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Hành Trình 28 Ngày Biết Ơn</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              &quot;Người nào đã có sẵn lòng biết ơn sẽ được ban tặng thêm, và anh ta sẽ có dư dả đủ đầy. Người nào không có sẵn lòng biết ơn, thì những gì anh ta đã có cũng sẽ bị tước đi.&quot;
            </p>
          </div>

          {/* Progress Card */}
          <div className="glass-panel border-amber-500/20 bg-amber-950/15 p-5 rounded-2xl flex items-center gap-4 max-w-xs md:self-start shrink-0">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Tiến trình</span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">{completedDays.length} / 28 Ngày</h3>
              <div className="w-28 bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden border border-white/5">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${(completedDays.length / 28) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {fetching ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {MAGIC_DAYS.map((day) => {
              const isCompleted = completedDays.includes(day.day)
              const isCurrent = day.day === nextDay
              const isLocked = day.day > nextDay

              return (
                <div key={day.day} className="relative">
                  {/* Card link wrapper */}
                  <Link
                    href={isLocked ? '#' : `/magic/day/${day.day}`}
                    className={`h-32 rounded-xl border flex flex-col items-center justify-center p-3 text-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-amber-600/10 border-amber-500/30 text-amber-400 cursor-pointer hover:bg-amber-600/20' 
                        : isCurrent 
                          ? 'bg-amber-500/20 border-amber-400 text-white cursor-pointer ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10 hover:bg-amber-500/30 animate-pulse-slow' 
                          : 'bg-slate-900/50 border-white/5 text-slate-500 cursor-not-allowed opacity-40'
                    }`}
                    onClick={(e) => {
                      if (isLocked) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Ngày</span>
                    <span className="text-3xl font-black mt-0.5 tracking-tighter">{day.day}</span>
                    
                    {/* Status Badge */}
                    <div className="mt-2">
                      {isCompleted ? (
                        <div className="h-5 w-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      ) : isCurrent ? (
                        <div className="h-5 w-5 rounded-full bg-amber-500 border border-amber-400 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                          VÀO
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-slate-950/60 border border-white/5 flex items-center justify-center text-slate-600">
                          <Lock className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Absolute day hover title tooltip */}
                  <div className="mt-2 text-center overflow-hidden">
                    <span className={`text-[10px] font-semibold truncate block max-w-full px-1 ${
                      isCompleted ? 'text-amber-400/80' : isCurrent ? 'text-white font-bold' : 'text-slate-600'
                    }`}>
                      {day.title}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Motivational Card */}
        {completedDays.length === 28 && (
          <div className="mt-12 glass-panel border-amber-500/30 bg-amber-500/5 p-8 rounded-2xl text-center space-y-4">
            <Heart className="h-16 w-16 text-amber-400 fill-amber-400 mx-auto animate-bounce" />
            <h2 className="text-2xl font-black text-white text-gold-gradient">Chúc mừng bạn đã hoàn thành 28 ngày!</h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              Bạn đã hoàn thành trọn vẹn hành trình 28 ngày thực hành lòng biết ơn. Phép màu đã ăn sâu vào trong suy nghĩ, thói quen và cuộc sống của bạn. Hãy tiếp tục nuôi dưỡng nó mỗi ngày nhé!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

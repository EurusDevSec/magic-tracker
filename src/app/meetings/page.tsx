'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import {
  Presentation, Plus, Calendar, Clock, ChevronRight,
  Loader2, Users, ImageIcon, Sparkles
} from 'lucide-react'

type BossMeeting = {
  id: string
  title: string
  meeting_date: string
  meeting_time: string
  summary: string
  decisions: string | null
  challenges: string[] | null
  tags: string[] | null
  attachments: string[] | null
  created_by: string | null
  created_at: string
}

const TAG_COLORS: Record<string, string> = {
  'Nội lực':       'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Triết lý':      'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Tam Bảo':       'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Tự phát triển': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Giao tiếp':     'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Thấu cảm':      'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Định vị nghề nghiệp': 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'Tủ sách':       'bg-orange-500/15 text-orange-300 border-orange-500/30',
}

const DEFAULT_TAG_COLOR = 'bg-slate-500/15 text-slate-300 border-slate-500/30'

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5)
}

export default function MeetingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [meetings, setMeetings] = useState<BossMeeting[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const fetchMeetings = async () => {
      try {
        const { data, error } = await supabase
          .from('boss_meetings')
          .select('*')
          .order('meeting_date', { ascending: false })
        if (error) throw error
        setMeetings(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchMeetings()
  }, [user, supabase])

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
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto w-full space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                <Presentation className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Review Định Kỳ</h1>
                <p className="text-sm text-slate-400 mt-0.5">Nhật ký các buổi review với Mentor — lưu trữ để toàn đội cùng nắm</p>
              </div>
            </div>
            <Link
              href="/meetings/new"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Ghi nhận buổi họp
            </Link>
          </div>

          {/* Content */}
          {fetching ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          ) : meetings.length === 0 ? (
            /* Empty State */
            <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-5">
              <div className="h-20 w-20 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                <Presentation className="h-10 w-10 text-violet-400 opacity-60" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Chưa có buổi họp nào</h2>
                <p className="text-slate-400 text-sm max-w-sm">Ghi nhận nội dung buổi họp với sếp để toàn đội đều nắm được định hướng và bài học chia sẻ.</p>
              </div>
              <Link
                href="/meetings/new"
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Ghi nhận buổi họp đầu tiên
              </Link>
            </div>
          ) : (
            /* Timeline */
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-violet-500/40 via-violet-500/20 to-transparent hidden md:block" />

              <div className="space-y-6">
                {meetings.map((meeting, index) => (
                  <div key={meeting.id} className="relative flex gap-6">
                    {/* Timeline dot */}
                    <div className="hidden md:flex shrink-0 relative z-10 h-10 w-10 items-center justify-center">
                      <div className={`h-3 w-3 rounded-full border-2 ${index === 0 ? 'bg-violet-400 border-violet-300 shadow-lg shadow-violet-500/50' : 'bg-slate-700 border-slate-500'}`} />
                    </div>

                    {/* Card */}
                    <div className="glass-card rounded-2xl p-5 flex-1 hover:border-violet-500/30 transition-all duration-300 group">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors leading-tight">{meeting.title}</h2>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(meeting.meeting_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(meeting.meeting_time)}
                            </span>
                            {meeting.attachments && meeting.attachments.length > 0 && (
                              <span className="flex items-center gap-1 text-violet-400">
                                <ImageIcon className="h-3 w-3" />
                                {meeting.attachments.length} ảnh
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Attachment thumbnail */}
                        {meeting.attachments && meeting.attachments.length > 0 && (
                          <div className="shrink-0 h-14 w-20 rounded-lg overflow-hidden border border-white/10">
                            <img src={meeting.attachments[0]} alt="Ảnh buổi họp" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {meeting.tags && meeting.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {meeting.tags.map(tag => (
                            <span key={tag} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || DEFAULT_TAG_COLOR}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Summary preview */}
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {meeting.summary}
                      </p>

                      {/* Decisions preview */}
                      {meeting.decisions && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-3">
                          <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Lời khuyên từ mentor
                          </p>
                          <p className="text-xs text-amber-200/70 italic line-clamp-2">
                            {meeting.decisions.replace(/>/g, '').replace(/\*\*/g, '').trim().split('\n')[0]}
                          </p>
                        </div>
                      )}

                      {/* Challenges count + CTA */}
                      <div className="flex items-center justify-between">
                        {meeting.challenges && meeting.challenges.length > 0 ? (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {meeting.challenges.length} thử thách được đề cập
                          </span>
                        ) : <span />}
                        <Link
                          href={`/meetings/${meeting.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                        >
                          Xem chi tiết <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

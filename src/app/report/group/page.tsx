'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import UserAvatar from '@/components/UserAvatar'
import { 
  Users, Plus, Calendar, Clock, User, 
  BookOpen, AlertTriangle, Lightbulb, ClipboardList, Loader2, Image
} from 'lucide-react'
import Link from 'next/link'

type Profile = { id: string; email: string; full_name: string; avatar_url: string | null; role: string }
type GroupMeeting = {
  id: string
  meeting_date: string
  meeting_time: string
  duration_minutes: number
  participants: string[]
  content: string
  difficulties: string
  solutions: string
  assignments: Array<{ user_id: string; task: string }>
  attachments?: string[] | null
  created_by: string
  created_at: string
}

const MEMBER_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#3b82f6', '#84cc16', '#f97316', '#a78bfa'
]

export default function GroupMeetingHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [meetings, setMeetings] = useState<GroupMeeting[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [fetching, setFetching] = useState(true)
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number>(0)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const fetchData = useCallback(async () => {
    if (!user) return
    setFetching(true)
    try {
      const [profilesRes, meetingsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('group_meetings').select('*').order('meeting_date', { ascending: false })
      ])
      setProfiles(profilesRes.data || [])
      setMeetings(meetingsRes.data || [])
    } catch (err) {
      console.error('Error fetching group meetings data:', err)
    } finally {
      setFetching(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate meetings completed in the current week (Monday to Sunday)
  const getMeetingsThisWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return meetings.filter(m => {
      const mDate = new Date(m.meeting_date)
      return mDate >= monday && mDate <= sunday
    }).length
  }

  const meetingsThisWeek = getMeetingsThisWeek()

  const getMemberInitialAndColor = (userId: string) => {
    const idx = profiles.findIndex(p => p.id === userId)
    const prof = profiles[idx]
    const color = idx !== -1 ? MEMBER_COLORS[idx % MEMBER_COLORS.length] : '#64748b'
    const initial = prof?.full_name?.charAt(0).toUpperCase() || '?'
    const name = prof?.full_name || 'Thành viên'
    return { initial, color, name }
  }

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
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8 text-violet-400" /> Ghi Chép Họp Nhóm
            </h1>
            <p className="text-slate-400 text-sm mt-1">Ghi nhận nội dung, khó khăn và phân công công việc của các buổi họp nhóm định kỳ.</p>
          </div>
          <Link
            href="/report/group/new"
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-violet-600/10 cursor-pointer self-start sm:self-center shrink-0"
          >
            <Plus className="h-4 w-4" /> Lập ghi chép mới
          </Link>
        </div>

        {fetching ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Rules and Attendance Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Meeting frequency status card */}
              <div className="glass-card p-5 rounded-2xl md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 border border-violet-500/10">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">Tiến độ tuần này</div>
                  <h3 className="text-xl font-black text-white">
                    Đã thực hiện: <span className="text-violet-400 text-2xl">{meetingsThisWeek}</span> / 2 buổi họp
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                    Khuyến nghị tổ chức họp nhóm vào <span className="font-semibold text-violet-300">Thứ Ba</span> và <span className="font-semibold text-violet-300">Thứ Bảy</span> hằng tuần (thời lượng 30-60 phút) để cùng trao đổi, giải quyết khó khăn.
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center shrink-0 bg-white/5 border border-white/5 px-6 py-4 rounded-xl text-center">
                  <span className="text-3xl font-black text-emerald-400">+{meetingsThisWeek >= 2 ? 5 : Math.max(0, meetingsThisWeek * 2)}</span>
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider mt-1">Điểm thưởng</span>
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="glass-card p-5 rounded-2xl flex flex-col justify-center space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">💡 Quy tắc chấm điểm</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nhóm nộp đầy đủ tối thiểu 02 ghi chép họp / tuần và hỗ trợ nhau chia sẻ kiến thức sẽ được **cộng tối đa 5 điểm thưởng** vào phần đánh giá thái độ.
                </p>
              </div>
            </div>

            {/* Meetings Timeline */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white mb-4">📅 Lịch sử họp nhóm ({meetings.length} buổi)</h2>

              {meetings.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center border border-dashed border-white/5 flex flex-col items-center justify-center gap-3">
                  <Users className="h-10 w-10 text-slate-600 animate-pulse" />
                  <p className="text-sm text-slate-400 italic">Chưa có ghi chép họp nhóm nào được ghi nhận.</p>
                  <Link
                    href="/report/group/new"
                    className="text-xs font-bold text-violet-400 hover:text-violet-300 underline mt-2"
                  >
                    Tạo ghi chép họp nhóm đầu tiên của bạn &rarr;
                  </Link>
                </div>
              ) : (
                <div className="space-y-6 relative border-l border-white/5 ml-4 pl-6 md:pl-8">
                  {meetings.map((meeting) => {
                    const writer = profiles.find(p => p.id === meeting.created_by)
                    const writerName = writer?.full_name || 'Thành viên'
                    
                    return (
                      <div key={meeting.id} className="relative group/meeting animate-fadeIn">
                        {/* Bullet indicator */}
                        <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-slate-950 border-2 border-violet-500 group-hover/meeting:bg-violet-400 transition-colors z-10" />

                        {/* Meeting Card */}
                        <div className="glass-card p-6 rounded-2xl space-y-5">
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1 font-bold text-slate-200">
                                <Calendar className="h-4 w-4 text-violet-400" />
                                {new Date(meeting.meeting_date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                              <span className="h-1 w-1 bg-slate-600 rounded-full" />
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-violet-400" />
                                {meeting.meeting_time.substring(0, 5)} ({meeting.duration_minutes} phút)
                              </span>
                            </div>

                            {/* Writer profile & Edit action */}
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Lập ghi chép:</span>
                                <span className="font-semibold text-slate-200">{writerName}</span>
                              </div>
                              {user && meeting.created_by === user.id && (
                                <>
                                  <span className="h-3 w-px bg-white/10" />
                                  <Link
                                    href={`/report/group/new?edit=${meeting.id}`}
                                    className="text-violet-400 hover:text-violet-300 font-bold transition-colors cursor-pointer"
                                  >
                                    Chỉnh sửa
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Meeting contents */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-5">
                              {/* 1. Content discussed */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <BookOpen className="h-4 w-4 text-violet-400" /> 1. Nội dung trao đổi & kết quả họp
                                </h4>
                                <div className="bg-slate-950/45 border border-white/5 rounded-xl p-4 ml-6">
                                  <p className="text-[13.5px] text-slate-100 leading-relaxed whitespace-pre-wrap">{meeting.content}</p>
                                </div>
                              </div>

                              {/* 2. Difficulties and Blockers */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <AlertTriangle className="h-4 w-4 text-rose-400" /> 2. Khó khăn / Vấn đề gặp phải
                                </h4>
                                <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-4 ml-6">
                                  <p className="text-[13.5px] text-rose-100 leading-relaxed whitespace-pre-wrap">{meeting.difficulties}</p>
                                </div>
                              </div>

                              {/* 3. Solutions */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <Lightbulb className="h-4 w-4 text-emerald-400" /> 3. Giải pháp đề xuất
                                </h4>
                                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 ml-6">
                                  <p className="text-[13.5px] text-emerald-100 leading-relaxed whitespace-pre-wrap">{meeting.solutions}</p>
                                </div>
                              </div>

                              {/* Meeting attachments */}
                              {meeting.attachments && meeting.attachments.length > 0 && (
                                <div className="space-y-2 pt-2">
                                  <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Image className="h-4 w-4 text-violet-400" /> Ảnh minh chứng cuộc họp
                                  </h4>
                                  <div className="flex flex-wrap gap-2 ml-6 bg-slate-950/30 border border-white/5 p-2 rounded-xl">
                                    {meeting.attachments.map((img, idx) => (
                                      <div 
                                        key={idx} 
                                        className="h-16 w-24 rounded-lg overflow-hidden border border-white/5 cursor-zoom-in hover:scale-[1.02] transition-all"
                                        onClick={() => {
                                          setLightboxImages(meeting.attachments!)
                                          setLightboxIndex(idx)
                                        }}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img} alt={`Minh chứng ${idx + 1}`} className="h-full w-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 4. Task Assignments */}
                            <div className="space-y-3 bg-slate-900/60 border border-white/10 rounded-2xl p-5 self-start shadow-md">
                              <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                                <ClipboardList className="h-4 w-4 text-violet-400" /> Phân công nhiệm vụ
                              </h4>
                              
                              <div className="space-y-4">
                                {meeting.assignments.map((as, idx) => {
                                  const { initial, color, name } = getMemberInitialAndColor(as.user_id)
                                  return (
                                    <div key={idx} className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <div 
                                          className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow"
                                          style={{ backgroundColor: color }}
                                        >
                                          {initial}
                                        </div>
                                        <span className="text-xs.5 font-bold text-slate-100">{name}</span>
                                      </div>
                                      <p className="text-[12px] text-slate-300 pl-6 leading-relaxed font-normal">{as.task}</p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Meeting Participants Avatars */}
                          <div className="border-t border-white/5 pt-3.5 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Thành viên tham dự:</span>
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {meeting.participants.map((pId) => {
                                  const { initial, color, name } = getMemberInitialAndColor(pId)
                                  return (
                                    <UserAvatar
                                      key={pId}
                                      avatarUrl={profiles.find(p => p.id === pId)?.avatar_url}
                                      fullName={name}
                                      sizeClass="h-6 w-6 text-[9px]"
                                      style={{ backgroundColor: color, borderWidth: '1px', borderColor: 'rgb(15 23 42)' }}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              Lập lúc: {new Date(meeting.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxImages && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md no-print" 
            onClick={() => setLightboxImages(null)}
          >
            {/* Close button */}
            <button 
              onClick={() => setLightboxImages(null)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-white h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-xl transition-all cursor-pointer z-10 animate-fadeIn"
            >
              ✕
            </button>

            {/* Prev button */}
            {lightboxIndex > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(prev => prev - 1)
                }} 
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-2xl transition-all cursor-pointer z-10"
              >
                ‹
              </button>
            )}

            {/* Next button */}
            {lightboxIndex < lightboxImages.length - 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(prev => prev + 1)
                }} 
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-2xl transition-all cursor-pointer z-10"
              >
                ›
              </button>
            )}

            {/* Main Image Container */}
            <div 
              className="relative max-w-5xl max-h-[85vh] flex flex-col items-center justify-center animate-scaleUp"
              onClick={e => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={lightboxImages[lightboxIndex]} 
                alt={`Image detail ${lightboxIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg border border-white/10 shadow-2xl"
              />
              <div className="text-xs text-slate-400 font-semibold mt-4 bg-slate-900/80 px-4 py-1.5 rounded-full border border-white/5">
                Ảnh {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}

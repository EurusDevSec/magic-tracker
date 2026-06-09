'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  ListTodo, 
  BookOpen, 
  HelpCircle, 
  ArrowRight, 
  Loader2,
  FileText,
  Plus,
  Clock,
  Image,
  Users
} from 'lucide-react'
import Link from 'next/link'

type Report = {
  id: string
  report_date: string
  today_tasks: string
  lessons_learned: string | null
  problems_and_solutions: string | null
  next_day_plan: string
  attachments?: string[] | null
  created_at: string
}

export default function ReportHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const [reports, setReports] = useState<Report[]>([])
  const [fetching, setFetching] = useState(true)
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number>(0)

  const isReportLate = (utcStr: string) => {
    if (!utcStr) return false
    const date = new Date(utcStr)
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000)
    const vnTime = new Date(utcTime + (3600000 * 7)) // Vietnam is UTC+7
    return vnTime.getHours() >= 22
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    const fetchHistory = async () => {
      try {
        const [reportsRes, meetingsRes] = await Promise.all([
          supabase
            .from('reports')
            .select('*')
            .eq('user_id', user.id)
            .order('report_date', { ascending: false }),
          supabase
            .from('group_meetings')
            .select('*')
            .order('meeting_date', { ascending: false })
        ])

        if (reportsRes.error) throw reportsRes.error
        if (meetingsRes.error) throw meetingsRes.error

        const fetchedReports = reportsRes.data || []
        const fetchedMeetings = meetingsRes.data || []

        // Merge virtual reports from meetings
        const finalReports = [...fetchedReports]
        
        fetchedMeetings.forEach((meeting: any) => {
          const dateStr = meeting.meeting_date
          if (meeting.participants?.includes(user.id)) {
            const hasReport = finalReports.some(r => r.report_date === dateStr)
            if (!hasReport) {
              const assignment = meeting.assignments?.find((a: any) => a.user_id === user.id)
              const userTask = assignment ? assignment.task : ''
              
              finalReports.push({
                id: `virtual-group-${meeting.id}`,
                user_id: user.id,
                report_date: dateStr,
                today_tasks: `[Báo cáo nhóm] Tham gia họp nhóm định kỳ.\n- Nội dung họp: ${meeting.content}`,
                lessons_learned: `Giải pháp đề xuất: ${meeting.solutions}`,
                problems_and_solutions: `Khó khăn từ họp nhóm: ${meeting.difficulties}`,
                next_day_plan: userTask || 'Theo phân công của họp nhóm.',
                attachments: meeting.attachments || [],
                created_at: meeting.created_at,
                updated_at: meeting.updated_at,
                is_virtual: true
              })
            }
          }
        })

        // Sort by report_date descending
        finalReports.sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())

        setReports(finalReports)
        if (finalReports.length > 0) {
          setExpandedReportId(finalReports[0].id)
        }
      } catch (err) {
        console.error('Error fetching report history:', err)
      } finally {
        setFetching(false)
      }
    }

    fetchHistory()
  }, [user])

  const toggleExpand = (id: string) => {
    setExpandedReportId(expandedReportId === id ? null : id)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    return d.toLocaleDateString('vi-VN', options)
  }

  const isToday = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString('en-CA')
    return dateStr === todayStr
  }

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
      
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Lịch Sử Báo Cáo</h1>
            <p className="text-slate-400 text-sm mt-1">Danh sách các báo cáo bạn đã nộp từ trước đến nay.</p>
          </div>
          <Link
            href="/report"
            className="flex items-center gap-1.5 self-start bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all duration-200 shadow-md shadow-violet-600/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Báo cáo hôm nay
          </Link>
        </div>

        {fetching ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center flex flex-col items-center">
            <FileText className="h-16 w-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Chưa có báo cáo nào</h3>
            <p className="text-slate-400 text-sm max-w-sm mb-6">
            Bạn chưa nộp bất kỳ báo cáo tiến độ nào trên hệ thống <span className="text-violet-400 font-semibold">ETI Tracker</span>.
            </p>
            <Link
              href="/report"
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
            >
              Nộp báo cáo đầu tiên <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const expanded = expandedReportId === report.id
              const today = isToday(report.report_date)
              
              return (
                <div 
                  key={report.id} 
                  className={`glass-card rounded-2xl overflow-hidden border transition-all duration-200 ${
                    today 
                      ? 'border-violet-500/30 shadow-md shadow-violet-500/5' 
                      : 'border-white/5'
                  }`}
                >
                  {/* Collapsible Header */}
                  <div 
                    onClick={() => toggleExpand(report.id)}
                    className="flex justify-between items-center p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                        today 
                          ? 'bg-violet-600/20 text-violet-400 border-violet-500/30' 
                          : 'bg-slate-900 text-slate-400 border-white/5'
                      }`}>
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">
                            {formatDate(report.report_date)}
                          </h4>
                          {today && (
                            <span className="text-[10px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-400">
                            Đã lưu lúc: {new Date(report.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {report.today_tasks?.startsWith('[Báo cáo nhóm]') && (
                            <span className="text-[9px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Users className="h-2.5 w-2.5" /> Báo cáo nhóm
                            </span>
                          )}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            isReportLate(report.created_at)
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {isReportLate(report.created_at) ? (
                              <>
                                <Clock className="h-2.5 w-2.5" /> Nộp muộn
                              </>
                            ) : (
                              'Đúng hạn'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                      {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Expanded Body */}
                  {expanded && (
                    <div className="border-t border-white/10 bg-slate-900/40 p-6 space-y-5 rounded-b-2xl">
                      
                      {/* 1. Today Tasks */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                          <ListTodo className="h-4 w-4 text-violet-400" /> Hôm nay đã hoàn thành
                        </div>
                        <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 ml-6">
                          <p className="text-[13.5px] text-slate-100 whitespace-pre-wrap leading-relaxed">
                            {report.today_tasks}
                          </p>
                        </div>
                      </div>

                      {/* 2. Lessons Learned */}
                      {report.lessons_learned && (
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                            <BookOpen className="h-4 w-4 text-violet-400" /> Bài học đúc kết được
                          </div>
                          <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 ml-6">
                            <p className="text-[13.5px] text-slate-100 whitespace-pre-wrap leading-relaxed">
                              {report.lessons_learned}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 3. Problems and Solutions */}
                      {report.problems_and_solutions && (
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                            <HelpCircle className="h-4 w-4 text-violet-400" /> Khó khăn & Giải pháp
                          </div>
                          <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 ml-6">
                            <p className="text-[13.5px] text-slate-100 whitespace-pre-wrap leading-relaxed">
                              {report.problems_and_solutions}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 4. Next Day Plan */}
                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                          <Calendar className="h-4 w-4 text-violet-400" /> Kế hoạch ngày mai
                        </div>
                        <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 ml-6">
                          <p className="text-[13.5px] text-slate-100 whitespace-pre-wrap leading-relaxed">
                            {report.next_day_plan}
                          </p>
                        </div>
                      </div>

                      {/* 5. Screenshot Evidences */}
                      {report.attachments && report.attachments.length > 0 && (
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                            <Image className="h-4 w-4 text-violet-400" /> Ảnh minh chứng kết quả ({report.attachments.length})
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 ml-6">
                            {report.attachments.map((img, idx) => (
                              <div 
                                key={idx} 
                                className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-md group cursor-zoom-in"
                                onClick={() => {
                                  setLightboxImages(report.attachments!)
                                  setLightboxIndex(idx)
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={img} 
                                  alt={`Minh chứng ${idx + 1}`}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Edit Button */}
                      {today && (
                        <div className="flex justify-end border-t border-white/5 pt-4">
                          <Link
                            href="/report"
                            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors border border-violet-500/20 px-3.5 py-1.5 rounded-lg bg-violet-500/5 hover:bg-violet-500/10"
                          >
                            Chỉnh sửa báo cáo hôm nay
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
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

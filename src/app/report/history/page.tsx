'use client'

import { useState, useEffect } from 'react'
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
  Plus
} from 'lucide-react'
import Link from 'next/link'

type Report = {
  id: string
  report_date: string
  today_tasks: string
  lessons_learned: string | null
  problems_and_solutions: string | null
  next_day_plan: string
  created_at: string
}

export default function ReportHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [fetching, setFetching] = useState(true)
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('report_date', { ascending: false })

        if (error) throw error
        setReports(data || [])
        if (data && data.length > 0) {
          setExpandedReportId(data[0].id) // Expand the latest report by default
        }
      } catch (err) {
        console.error('Error fetching report history:', err)
      } finally {
        setFetching(false)
      }
    }

    fetchHistory()
  }, [user, supabase])

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
      
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-5xl">
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
              Bạn chưa nộp bất kỳ báo cáo tiến độ nào trên hệ thống Eurus Hub.
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
                        <p className="text-xs text-slate-400 mt-0.5">
                          Đã lưu lúc: {new Date(report.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <button className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                      {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Expanded Body */}
                  {expanded && (
                    <div className="border-t border-white/5 bg-slate-950/40 p-6 space-y-6">
                      
                      {/* 1. Today Tasks */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                          <ListTodo className="h-4 w-4" /> Hôm nay làm gì
                        </div>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap pl-6">
                          {report.today_tasks}
                        </p>
                      </div>

                      {/* 2. Lessons Learned */}
                      {report.lessons_learned && (
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                            <BookOpen className="h-4 w-4" /> Học được gì
                          </div>
                          <p className="text-sm text-slate-200 whitespace-pre-wrap pl-6">
                            {report.lessons_learned}
                          </p>
                        </div>
                      )}

                      {/* 3. Problems and Solutions */}
                      {report.problems_and_solutions && (
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                            <HelpCircle className="h-4 w-4" /> Gặp khó khăn & Cách giải quyết
                          </div>
                          <p className="text-sm text-slate-200 whitespace-pre-wrap pl-6">
                            {report.problems_and_solutions}
                          </p>
                        </div>
                      )}

                      {/* 4. Next Day Plan */}
                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                          <Calendar className="h-4 w-4" /> Ngày mai làm gì
                        </div>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap pl-6">
                          {report.next_day_plan}
                        </p>
                      </div>

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
      </main>
    </div>
  )
}

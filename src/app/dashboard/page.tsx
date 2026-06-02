'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  FileText, 
  Heart, 
  Loader2, 
  Calendar, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react'

type Profile = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: string
}

type Report = {
  id: string
  user_id: string
  report_date: string
  today_tasks: string
  lessons_learned: string | null
  problems_and_solutions: string | null
  next_day_plan: string
}

type GratitudeStat = {
  user_id: string
  count: number
}

export default function AdminDashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Data States
  const [members, setMembers] = useState<Profile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [gratitudeStats, setGratitudeStats] = useState<GratitudeStat[]>([])
  const [fetching, setFetching] = useState(true)

  // Grid/Date Config
  const [dateRangeSize, setDateRangeSize] = useState(7) // default past 7 days
  const [datesList, setDatesList] = useState<string[]>([])
  
  // Modal State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Redirect non-admins
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (profile?.role !== 'admin') {
        router.push('/report')
      }
    }
  }, [user, profile, loading, router])

  // Generate list of dates to track (e.g. past N days)
  useEffect(() => {
    const list: string[] = []
    for (let i = dateRangeSize - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      list.push(d.toLocaleDateString('en-CA')) // YYYY-MM-DD local format
    }
    setDatesList(list)
  }, [dateRangeSize])

  // Fetch all dashboard data
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return

    const fetchDashboardData = async () => {
      setFetching(true)
      try {
        // 1. Fetch all members
        const { data: profilesData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name')

        if (profileErr) throw profileErr
        const filteredMembers = profilesData || []
        setMembers(filteredMembers)

        // 2. Fetch reports in the date range
        if (datesList.length > 0) {
          const startDate = datesList[0]
          const endDate = datesList[datesList.length - 1]

          const { data: reportsData, error: reportsErr } = await supabase
            .from('reports')
            .select('*')
            .gte('report_date', startDate)
            .lte('report_date', endDate)

          if (reportsErr) throw reportsErr
          setReports(reportsData || [])
        }

        // 3. Fetch gratitude challenge counts per user
        const { data: logsData, error: logsErr } = await supabase
          .from('gratitude_logs')
          .select('user_id')

        if (logsErr) throw logsErr
        
        // Count completions manually
        const counts: Record<string, number> = {}
        logsData?.forEach((log: { user_id: string }) => {
          counts[log.user_id] = (counts[log.user_id] || 0) + 1
        })
        
        const statsArray = Object.entries(counts).map(([userId, count]) => ({
          user_id: userId,
          count
        }))
        setGratitudeStats(statsArray)

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setFetching(false)
      }
    }

    if (datesList.length > 0) {
      fetchDashboardData()
    }
  }, [user, profile, datesList, supabase])

  // Helper: Find report by user and date
  const findReport = (userId: string, dateStr: string) => {
    return reports.find(r => r.user_id === userId && r.report_date === dateStr)
  }

  // Helper: Get Gratitude Count
  const getGratitudeCount = (userId: string) => {
    const stat = gratitudeStats.find(s => s.user_id === userId)
    return stat ? stat.count : 0
  }

  const openReportModal = (report: Report, memberName: string) => {
    setSelectedReport(report)
    setSelectedMemberName(memberName)
    setIsModalOpen(true)
  }

  // Calculate high level stats
  const totalMembers = members.filter(m => m.role === 'member').length
  const todayStr = new Date().toLocaleDateString('en-CA')
  const submittedToday = reports.filter(r => r.report_date === todayStr).length
  const todaySubmissionRate = totalMembers > 0 
    ? Math.round((submittedToday / totalMembers) * 100) 
    : 0

  const formatHeaderDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })
  }

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' }
    return d.toLocaleDateString('vi-VN', options)
  }

  if (loading || profile?.role !== 'admin') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl relative">
        {/* Glow Blob */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Title */}
        <div className="mb-8 border-b border-white/5 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Theo dõi tiến độ báo cáo hàng ngày và lộ trình 28 ngày biết ơn của toàn bộ thành viên.
          </p>
        </div>

        {fetching ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Total Members */}
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng thành viên</span>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{totalMembers}</h3>
                  <p className="text-xs text-slate-500 mt-1">Không tính tài khoản Admin</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              {/* Card 2: Today Submission Rate */}
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tỷ lệ nộp hôm nay</span>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{todaySubmissionRate}%</h3>
                  <div className="w-24 bg-slate-900 h-1 rounded-full mt-2 overflow-hidden border border-white/5">
                    <div 
                      className="bg-violet-500 h-full rounded-full" 
                      style={{ width: `${todaySubmissionRate}%` }}
                    />
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              {/* Card 3: Today Reports Count */}
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Số báo cáo hôm nay</span>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{submittedToday} / {totalMembers}</h3>
                  <p className="text-xs text-slate-500 mt-1">Đã nộp đầy đủ hôm nay</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <FileText className="h-6 w-6" />
                </div>
              </div>

              {/* Card 4: Top Gratitude Challenge */}
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hành trình biết ơn</span>
                  <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
                    {members.length > 0 ? Math.max(...members.map(m => getGratitudeCount(m.id)), 0) : 0} / 28
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Ngày hoàn thành cao nhất</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Heart className="h-6 w-6 fill-amber-500/10" />
                </div>
              </div>

            </div>

            {/* Tracking Grid Section */}
            <div className="glass-card p-6 rounded-2xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-violet-400" /> Bảng Theo Dõi Nộp Báo Cáo
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Click vào các ô xanh để xem chi tiết báo cáo.</p>
                </div>

                {/* Range Filters */}
                <div className="flex items-center gap-2 bg-slate-900 border border-white/5 p-1 rounded-xl">
                  {[7, 14, 30].map((size) => (
                    <button
                      key={size}
                      onClick={() => setDateRangeSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        dateRangeSize === size 
                          ? 'bg-violet-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {size} ngày qua
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable grid wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase w-48 shrink-0">Thành viên</th>
                      <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-center w-28 shrink-0 border-r border-white/5">Cảm ơn (The Magic)</th>
                      {datesList.map((dateStr) => (
                        <th key={dateStr} className="py-3 px-2 text-xs font-semibold text-slate-300 text-center min-w-16">
                          <span className="block text-[10px] text-slate-500 font-bold uppercase">{getDayName(dateStr)}</span>
                          <span className="block mt-0.5">{formatHeaderDate(dateStr)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members
                      .filter(m => m.role !== 'admin') // Only show normal members in the matrix
                      .map((member) => {
                        const gratitudeCount = getGratitudeCount(member.id)
                        
                        return (
                          <tr key={member.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                            {/* Member profile */}
                            <td className="py-3 px-4 flex items-center gap-3 w-48 truncate">
                              <div className="h-8 w-8 rounded-full bg-violet-500/10 text-violet-300 font-bold flex items-center justify-center text-xs border border-violet-500/20 shrink-0">
                                {member.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <h5 className="font-bold text-sm text-white truncate">{member.full_name}</h5>
                                <p className="text-[10px] text-slate-500 truncate">{member.email}</p>
                              </div>
                            </td>

                            {/* Gratitude Journey counter */}
                            <td className="py-3 px-4 text-center w-28 border-r border-white/5">
                              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                                gratitudeCount === 28 
                                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' 
                                  : gratitudeCount > 0 
                                    ? 'bg-slate-900 border-white/10 text-amber-200' 
                                    : 'bg-slate-900 border-white/5 text-slate-500'
                              }`}>
                                <Heart className={`h-3 w-3 ${gratitudeCount > 0 ? 'fill-amber-400/20' : ''}`} /> {gratitudeCount}/28
                              </span>
                            </td>

                            {/* Date tracking cells */}
                            {datesList.map((dateStr) => {
                              const report = findReport(member.id, dateStr)
                              const submitted = !!report
                              
                              return (
                                <td key={dateStr} className="py-3 px-2 text-center">
                                  {submitted ? (
                                    <button
                                      onClick={() => openReportModal(report, member.full_name)}
                                      className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
                                      title="Click để xem chi tiết báo cáo"
                                    >
                                      <CheckCircle className="h-4.5 w-4.5" />
                                    </button>
                                  ) : (
                                    <div 
                                      className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400"
                                      title="Chưa nộp báo cáo ngày này"
                                    >
                                      <XCircle className="h-4.5 w-4.5" />
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>

              {/* Legends help */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-400" /> Ô xanh lá: Đã nộp báo cáo
                </span>
                <span className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-400" /> Ô đỏ: Trống ngày (Chưa nộp)
                </span>
                <span className="flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-slate-500" /> Báo cáo lưu tự động theo múi giờ hệ thống
                </span>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Modal - View Report Details */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Báo cáo chi tiết</span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">{selectedMemberName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ngày nộp: {new Date(selectedReport.report_date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl p-1 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* 1. Today Tasks */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">1. Hôm nay làm gì</h4>
                <p className="text-sm text-slate-200 whitespace-pre-wrap pl-4 border-l border-white/10 leading-relaxed">
                  {selectedReport.today_tasks}
                </p>
              </div>

              {/* 2. Lessons Learned */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">2. Học được gì</h4>
                <p className="text-sm text-slate-200 whitespace-pre-wrap pl-4 border-l border-white/10 leading-relaxed">
                  {selectedReport.lessons_learned || <span className="text-slate-500 italic">Trống</span>}
                </p>
              </div>

              {/* 3. Problems and Solutions */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">3. Vấn đề & Giải pháp</h4>
                <p className="text-sm text-slate-200 whitespace-pre-wrap pl-4 border-l border-white/10 leading-relaxed">
                  {selectedReport.problems_and_solutions || <span className="text-slate-500 italic">Trống</span>}
                </p>
              </div>

              {/* 4. Next Day Plan */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">4. Ngày mai làm gì</h4>
                <p className="text-sm text-slate-200 whitespace-pre-wrap pl-4 border-l border-white/10 leading-relaxed">
                  {selectedReport.next_day_plan}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-900/40 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all cursor-pointer border border-white/5"
              >
                Đóng lại
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

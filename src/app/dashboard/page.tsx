'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import UserAvatar from '@/components/UserAvatar'
import Link from 'next/link'
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Legend, LabelList
} from 'recharts'
import {
  Users, CheckCircle, XCircle, TrendingUp, FileText,
  Loader2, Calendar, Info, Download, Printer, Clock
} from 'lucide-react'

type Profile = { id: string; email: string; full_name: string; avatar_url: string | null; role: string }
type Report = {
  id: string; user_id: string; report_date: string
  today_tasks: string; lessons_learned: string | null
  problems_and_solutions: string | null; next_day_plan: string
  attachments?: string[] | null
  created_at: string
  updated_at: string
}

const MEMBER_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#3b82f6', '#84cc16', '#f97316', '#a78bfa'
]
const PIE_COLORS = ['#8b5cf6', '#1e293b']

// Custom tooltip for daily bar chart
const CustomDailyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl text-xs">
        <p className="font-bold text-slate-300 mb-1">{label}</p>
        <p className="text-violet-400 font-medium flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          Báo cáo đã nộp: <span className="font-extrabold text-white">{payload[0].value} / {payload[0].payload.total}</span>
        </p>
      </div>
    )
  }
  return null
}

// Custom tooltip for pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl text-xs">
        <p className="font-bold flex items-center gap-1.5" style={{ color: data.payload.color || data.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: data.payload.color || data.color }} />
          {data.name}: <span className="font-extrabold text-white">{data.value} người</span>
        </p>
      </div>
    )
  }
  return null
}

// Custom tooltip for member bar chart
const MemberBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl text-xs">
        <p className="font-bold text-white mb-2 pb-1 border-b border-white/5">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any) => (
            <p key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color || p.fill }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              {p.name}: <span className="font-extrabold text-white">{p.value} ngày</span>
            </p>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const printRef = useRef<HTMLDivElement>(null)

  const [members, setMembers] = useState<Profile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [fetching, setFetching] = useState(true)
  const [dateRangeSize, setDateRangeSize] = useState(7)
  const [datesList, setDatesList] = useState<string[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFeedDate, setSelectedFeedDate] = useState('')
  const [groupMeetings, setGroupMeetings] = useState<any[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null)
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number>(0)
  

  const isReportLate = (report: any) => {
    if (!report?.created_at) return false
    const date = new Date(report.created_at)
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000)
    const vnTime = new Date(utcTime + (3600000 * 7)) // Vietnam is UTC+7
    return vnTime.getHours() >= 17
  }

  const formatSubmissionTime = (utcStr: string) => {
    if (!utcStr) return ''
    const date = new Date(utcStr)
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000)
    const vnTime = new Date(utcTime + (3600000 * 7))
    return vnTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }



  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // Generate dates: starting today, going backward into the past, skipping Sundays
  useEffect(() => {
    const list: string[] = []
    let daysAdded = 0
    let daysAgo = 0
    
    const today = new Date()
    // If today is Sunday, start counting from yesterday (Saturday)
    if (today.getDay() === 0) {
      today.setDate(today.getDate() - 1)
    }

    while (daysAdded < dateRangeSize) {
      const d = new Date(today)
      d.setDate(today.getDate() - daysAgo)
      if (d.getDay() !== 0) { // skip Sunday
        list.push(d.toLocaleDateString('en-CA'))
        daysAdded++
      }
      daysAgo++
    }
    setDatesList(list)
  }, [dateRangeSize])

  // Set default feed date to today when datesList changes
  useEffect(() => {
    if (datesList.length > 0) {
      setSelectedFeedDate(datesList[0])
    }
  }, [datesList])

  const fetchDashboardData = useCallback(async () => {
    if (!user || datesList.length === 0) return
    setFetching(true)
    try {
      const [profilesRes, reportsRes, groupMeetingsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('reports').select('*')
          .gte('report_date', datesList[datesList.length - 1])
          .lte('report_date', datesList[0]),
        supabase.from('group_meetings').select('*')
          .gte('meeting_date', datesList[datesList.length - 1])
          .lte('meeting_date', datesList[0])
      ])
      setMembers((profilesRes.data || []).filter((m: Profile) => m.role !== 'admin'))
      setReports(reportsRes.data || [])
      setGroupMeetings(groupMeetingsRes.data || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setFetching(false)
    }
  }, [user, datesList, supabase])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  const findReport = (userId: string, dateStr: string) =>
    reports.find(r => r.user_id === userId && r.report_date === dateStr)

  const getTodayOrLastWorkingDay = () => {
    const d = new Date()
    if (d.getDay() === 0) {
      d.setDate(d.getDate() - 1)
    }
    return d.toLocaleDateString('en-CA')
  }
  const todayStr = getTodayOrLastWorkingDay()
  const totalMembers = members.length
  const submittedToday = reports.filter(r => r.report_date === todayStr).length
  const todayRate = totalMembers > 0 ? Math.round((submittedToday / totalMembers) * 100) : 0

  // Bar chart: daily submission count
  const dailyBarData = datesList.map(dateStr => {
    const d = new Date(dateStr + 'T00:00:00')
    return {
      label: d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }),
      count: reports.filter(r => r.report_date === dateStr).length,
      total: totalMembers
    }
  })

  // Per-member chart: submitted vs missing for each member
  const memberChartData = members.map((m, idx) => {
    const submitted = datesList.filter(d => findReport(m.id, d)).length
    const missing = datesList.length - submitted
    return {
      name: m.full_name?.split(' ').slice(-1)[0] || m.email.split('@')[0], // short name
      fullName: m.full_name,
      submitted,
      missing,
      color: MEMBER_COLORS[idx % MEMBER_COLORS.length]
    }
  })

  // Pie chart today
  const pieData = [
    { name: 'Đã nộp', value: submittedToday },
    { name: 'Chưa nộp', value: Math.max(0, totalMembers - submittedToday) }
  ]

  // Export CSV
  const exportCSV = () => {
    const headers = ['Thành viên', 'Email', ...datesList]
    const rows = members.map(m => {
      const cells = datesList.map(d => findReport(m.id, d) ? 'Đã nộp' : 'Chưa nộp')
      return [m.full_name, m.email, ...cells]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bao-cao-eti-${todayStr}.csv`
    a.click()
  }

  // Print as PDF
  const handlePrintPDF = () => {
    window.print()
  }

  const formatHeaderDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })
  }
  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('vi-VN', { weekday: 'short' })
  }
  const isToday = (ds: string) => ds === todayStr

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-page { padding: 20px; }
          .glass-card, .glass-panel { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
          .text-white { color: #0f172a !important; }
          .text-slate-400, .text-slate-500 { color: #64748b !important; }
          .text-violet-400 { color: #7c3aed !important; }
          .text-emerald-400 { color: #059669 !important; }
          .text-rose-400 { color: #dc2626 !important; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100" ref={printRef}>
        <div className="no-print"><Navigation /></div>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto print-page">
          <div className="max-w-7xl mx-auto w-full">
            {/* Title */}
          <div className="mb-6 border-b border-white/5 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-1">ETI Tracker</p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">📊 Bảng Tổng Quan</h1>
              <p className="text-slate-400 text-sm mt-1">Theo dõi tiến độ báo cáo hàng ngày của toàn bộ thực tập sinh.</p>
            </div>
            <div className="flex gap-2 no-print">
              <button onClick={exportCSV}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 border border-violet-500/30 px-3 py-2 rounded-xl bg-violet-500/5 hover:bg-violet-500/10 transition-all cursor-pointer">
                <Download className="h-3.5 w-3.5" /> Xuất CSV
              </button>
              <button onClick={handlePrintPDF}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <Printer className="h-3.5 w-3.5" /> In / Xuất PDF
              </button>
            </div>
          </div>

          {fetching ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Tổng thực tập sinh', value: totalMembers, icon: Users, sub: 'Toàn bộ tài khoản' },
                  { 
                    label: new Date().getDay() === 0 ? 'Tỷ lệ nộp gần nhất' : 'Tỷ lệ nộp hôm nay', 
                    value: `${todayRate}%`, 
                    icon: TrendingUp, 
                    sub: `${submittedToday}/${totalMembers} người` 
                  },
                  { 
                    label: new Date().getDay() === 0 ? 'Báo cáo gần nhất' : 'Báo cáo hôm nay', 
                    value: `${submittedToday}/${totalMembers}`, 
                    icon: FileText, 
                    sub: new Date().getDay() === 0 ? 'Đã nộp gần nhất' : 'Đã nộp báo cáo' 
                  },
                  { label: 'Tổng kỳ này', value: reports.length, icon: Calendar, sub: `Trong ${dateRangeSize} ngày làm việc` },
                ].map((card, i) => (
                  <div key={i} className="glass-card p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</span>
                      <h3 className="text-2xl font-extrabold text-white mt-1">{card.value}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
                    </div>
                    <div className="h-11 w-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 shrink-0">
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily bar */}
                <div className="glass-card p-6 rounded-2xl lg:col-span-2">
                  <h3 className="text-sm font-bold text-white mb-4">📈 Số báo cáo nộp theo ngày</h3>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={dailyBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dailyBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="0 0" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} domain={[0, totalMembers || 1]} />
                      <Tooltip content={<CustomDailyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
                      <Bar dataKey="count" fill="url(#dailyBarGrad)" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="count" position="top" style={{ fill: '#c4b5fd', fontSize: 11, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Today pie */}
                <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white mb-2">🍩 {new Date().getDay() === 0 ? 'Báo cáo gần nhất' : 'Hôm nay'} ({new Date(todayStr + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})</h3>
                  <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Centered Donut Label */}
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white tracking-tighter leading-none">{todayRate}%</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold mt-1.5 tracking-wider">Tỷ lệ</span>
                    </div>

                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <defs>
                          <linearGradient id="pieActiveGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                          <linearGradient id="pieInactiveGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#0f172a" />
                          </linearGradient>
                        </defs>
                        <Pie 
                          data={pieData} 
                          dataKey="value" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={48} 
                          outerRadius={65} 
                          strokeWidth={0}
                          cornerRadius={6}
                        >
                          <Cell key="cell-0" fill="url(#pieActiveGrad)" />
                          <Cell key="cell-1" fill="url(#pieInactiveGrad)" />
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 mt-2 justify-center border-t border-white/5 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'linear-gradient(45deg, #06b6d4, #8b5cf6)' }} />
                      Đã nộp: <span className="font-bold text-white">{submittedToday}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#1e293b]" />
                      Chưa nộp: <span className="font-bold text-white">{Math.max(0, totalMembers - submittedToday)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-Member Stacked Bar Chart */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-1">👤 Tiến độ nộp theo từng người ({dateRangeSize} ngày làm việc)</h3>
                <p className="text-xs text-slate-500 mb-5">Cột xanh = Đã nộp, Cột tối = Còn thiếu</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={memberChartData} margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="memberSubmittedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                      <linearGradient id="memberMissingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0 0" stroke="rgba(255,255,255,0.02)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-20} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} domain={[0, dateRangeSize]} />
                    <Tooltip content={<MemberBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 12 }} />
                    <Bar dataKey="submitted" name="Đã nộp" stackId="a" fill="url(#memberSubmittedGrad)">
                      <LabelList dataKey="submitted" position="center" style={{ fill: '#fff', fontSize: 10, fontWeight: 700 }} />
                    </Bar>
                    <Bar dataKey="missing" name="Còn thiếu" stackId="a" fill="url(#memberMissingGrad)" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="missing" position="center" style={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        formatter={((v: unknown) => (Number(v) > 0 ? v : '')) as any} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reports and Plans Feed */}
              <div className="glass-card p-6 rounded-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-violet-400" /> 📢 Bảng Tin Báo Cáo & Kế Hoạch Đề Xuất
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Theo dõi chi tiết công việc hôm nay và kế hoạch đề xuất ngày mai của các thành viên.</p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center no-print">
                    <span className="text-xs text-slate-400 font-medium">Chọn ngày:</span>
                    <select
                      value={selectedFeedDate}
                      onChange={(e) => setSelectedFeedDate(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    >
                      {datesList.map(dateStr => (
                        <option key={dateStr} value={dateStr}>
                          {new Date(dateStr + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short', month: '2-digit', day: '2-digit' })}
                          {dateStr === todayStr ? (new Date().getDay() === 0 ? ' (Gần nhất)' : ' (Hôm nay)') : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Báo cáo cá nhân (2/3 width) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        👤 Báo cáo cá nhân
                      </h4>
                      <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-0.5 text-violet-300 font-semibold">
                        {members.filter(m => findReport(m.id, selectedFeedDate)).length}/{members.length} đã nộp
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {members.map((member, mIdx) => {
                        const report = findReport(member.id, selectedFeedDate)
                        const late = report ? isReportLate(report) : false
                        const memberColor = MEMBER_COLORS[mIdx % MEMBER_COLORS.length]

                        return (
                          <div 
                            key={member.id} 
                            className={`rounded-2xl border bg-slate-900/65 p-5 transition-all duration-300 hover:border-violet-500/30 hover:bg-slate-900/80 flex flex-col justify-between ${
                              report 
                                ? 'border-white/10 shadow-lg shadow-black/10' 
                                : 'border-dashed border-white/5 opacity-55'
                            }`}
                            style={report ? { borderLeft: `3px solid ${memberColor}` } : {}}
                          >
                            <div>
                              {/* Card Header */}
                              <div className="flex items-center justify-between gap-3 mb-3.5 border-b border-white/5 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <UserAvatar
                                    avatarUrl={member.avatar_url}
                                    fullName={member.full_name}
                                    sizeClass="h-7.5 w-7.5 text-[10.5px]"
                                    style={{ backgroundColor: `${memberColor}20`, color: memberColor, borderColor: `${memberColor}40`, borderWidth: '1px' }}
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs.5 text-white truncate max-w-[120px]">{member.full_name}</div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{member.email}</div>
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div>
                                  {report ? (
                                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                                      late 
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {late ? <Clock className="h-2.5 w-2.5" /> : <CheckCircle className="h-2.5 w-2.5" />}
                                      {late ? `Nộp muộn` : `Đúng hạn`}
                                    </span>
                                  ) : (
                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-white/5 text-slate-500 shrink-0">
                                      Chưa nộp
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Card Body */}
                              {report ? (
                                <div className="space-y-3.5">
                                  {/* Today tasks */}
                                  <div>
                                    <h4 className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">📋 Công việc hôm nay</h4>
                                    <p className="text-[13px] text-slate-100 line-clamp-3 leading-relaxed whitespace-pre-wrap font-normal">{report.today_tasks}</p>
                                  </div>

                                  {/* Collage of screenshots */}
                                  {report.attachments && report.attachments.length > 0 && (
                                    <div className="space-y-1.5 pt-1.5">
                                      <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">📸 Ảnh minh chứng</h4>
                                      <div className={`grid gap-1.5 rounded-xl overflow-hidden border border-white/5 bg-slate-950/50 p-1.5 ${
                                        report.attachments.length === 1 ? 'grid-cols-1' :
                                        report.attachments.length === 2 ? 'grid-cols-2' :
                                        'grid-cols-3'
                                      }`}>
                                        {report.attachments.slice(0, 3).map((img, idx) => {
                                          const isLast = idx === 2 && report.attachments!.length > 3
                                          const extraCount = report.attachments!.length - 3
                                          return (
                                            <div 
                                              key={idx} 
                                              className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-zoom-in"
                                              onClick={(e) => {
                                                e.stopPropagation()
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
                                              {isLast && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-black text-sm">
                                                  +{extraCount} ảnh
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Highlighted next day plan */}
                                  <div className="bg-violet-950/35 border border-violet-500/25 rounded-xl p-3 shadow-inner">
                                    <h4 className="text-[10.5px] font-black text-violet-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                      🔮 Kế hoạch ngày mai
                                    </h4>
                                    <p className="text-[13px] text-violet-100 font-medium leading-relaxed whitespace-pre-wrap">{report.next_day_plan}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                  <Info className="h-5.5 w-5.5 text-slate-600 mb-1.5" />
                                  <p className="text-xs text-slate-400 italic">Chưa nộp báo cáo ngày này.</p>
                                </div>
                              )}
                            </div>

                            {/* View full button */}
                            {report && (
                              <div className="flex justify-end mt-4 pt-2.5 border-t border-white/5">
                                <button
                                  onClick={() => { setSelectedReport(report); setSelectedMemberName(member.full_name); setIsModalOpen(true) }}
                                  className="text-[10.5px] font-bold text-violet-300 hover:text-violet-200 transition-colors flex items-center gap-0.5 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/5"
                                >
                                  Xem chi tiết <span className="text-[11px]">→</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right Column: Họp nhóm định kỳ (1/3 width, sticky) */}
                  <div className="space-y-4 lg:sticky lg:top-24 self-start">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-violet-400" /> Biên bản họp nhóm
                      </h4>
                      <Link 
                        href="/report/group" 
                        className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors font-bold"
                      >
                        Lịch sử họp →
                      </Link>
                    </div>

                    {(() => {
                      const dayMeetings = groupMeetings.filter(m => m.meeting_date === selectedFeedDate)
                      if (dayMeetings.length === 0) {
                        return (
                          <div className="bg-slate-900/30 border border-dashed border-white/5 rounded-2xl p-6 text-center text-slate-500 text-xs italic flex flex-col items-center justify-center space-y-3 min-h-[220px]">
                            <Users className="h-8 w-8 text-slate-700 stroke-[1.5]" />
                            <div className="space-y-1">
                              <p className="text-slate-400 font-semibold not-italic">Hôm nay không có họp nhóm</p>
                              <p className="text-[10px] text-slate-500">Nhóm chưa lập biên bản họp cho ngày này.</p>
                            </div>
                            <Link href="/report/group/new" className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] rounded-lg transition-all shadow-md cursor-pointer inline-block">
                              + Lập Biên Bản
                            </Link>
                          </div>
                        )
                      }
                      return (
                        <div className="space-y-4">
                          {dayMeetings.map(meeting => {
                            const writer = members.find(m => m.id === meeting.created_by)
                            return (
                              <div key={meeting.id} className="relative overflow-hidden bg-slate-900/75 border border-violet-500/25 rounded-2xl p-5 space-y-4 shadow-lg hover:border-violet-500/40 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
                                
                                <div className="flex items-center justify-between gap-3 text-xs border-b border-white/5 pb-2.5">
                                  <span className="flex items-center gap-1 font-bold text-violet-300">
                                    <Clock className="h-3.5 w-3.5" /> {meeting.meeting_time.substring(0, 5)} ({meeting.duration_minutes} phút)
                                  </span>
                                  <span className="text-[10px] text-slate-400">Lập bởi: <span className="font-semibold text-slate-300">{writer?.full_name?.split(' ').pop() || 'Thành viên'}</span></span>
                                </div>

                                <div className="space-y-3.5">
                                  <div>
                                    <span className="text-[10.5px] font-bold text-violet-300 uppercase tracking-wider block mb-1">📝 Nội dung cuộc họp</span>
                                    <p className="text-[13px] text-slate-100 leading-relaxed line-clamp-3 whitespace-pre-wrap font-normal">{meeting.content}</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-2.5 shadow-sm">
                                      <span className="text-[9.5px] font-bold text-rose-400 uppercase tracking-wider block mb-0.5">⚠️ Khó khăn</span>
                                      <p className="text-[11.5px] text-rose-100 leading-relaxed line-clamp-2 whitespace-pre-wrap">{meeting.difficulties || 'Không có'}</p>
                                    </div>
                                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-2.5 shadow-sm">
                                      <span className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">💡 Giải pháp</span>
                                      <p className="text-[11.5px] text-emerald-100 leading-relaxed line-clamp-2 whitespace-pre-wrap">{meeting.solutions || 'Không có'}</p>
                                    </div>
                                  </div>

                                  {meeting.assignments && meeting.assignments.length > 0 && (
                                    <div className="bg-slate-950/50 border border-white/10 rounded-xl p-3 space-y-2">
                                      <span className="text-[9.5px] font-bold text-violet-300 uppercase tracking-wider block border-b border-white/5 pb-1">🎯 Phân công ({meeting.assignments.length})</span>
                                      <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1 custom-scrollbar">
                                        {meeting.assignments.slice(0, 3).map((as: any, idx: number) => {
                                          const member = members.find(m => m.id === as.user_id)
                                          const name = member?.full_name || 'Thành viên'
                                          const memberIndex = members.findIndex(m => m.id === as.user_id)
                                          const color = memberIndex !== -1 ? MEMBER_COLORS[memberIndex % MEMBER_COLORS.length] : '#8b5cf6'
                                          return (
                                            <div key={idx} className="space-y-0.5">
                                              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-200">
                                                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                <span className="truncate">{name}</span>
                                              </div>
                                              <p className="text-[10px] text-slate-300 leading-relaxed pl-3 truncate font-normal">{as.task}</p>
                                            </div>
                                          )
                                        })}
                                        {meeting.assignments.length > 3 && (
                                          <div className="text-[9px] text-slate-500 text-center italic pt-0.5">
                                            và {meeting.assignments.length - 3} phân công khác...
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-3.5 border-t border-white/5 text-xs text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] uppercase font-bold text-slate-500">Tham gia:</span>
                                    <div className="flex -space-x-1 overflow-hidden">
                                      {meeting.participants.slice(0, 4).map((pId: string) => {
                                        const memberIndex = members.findIndex(m => m.id === pId)
                                        const color = memberIndex !== -1 ? MEMBER_COLORS[memberIndex % MEMBER_COLORS.length] : '#8b5cf6'
                                        const initial = members.find(m => m.id === pId)?.full_name?.charAt(0).toUpperCase() || '?'
                                        return (
                                          <UserAvatar
                                            key={pId}
                                            avatarUrl={members.find(m => m.id === pId)?.avatar_url}
                                            fullName={members.find(m => m.id === pId)?.full_name || '?'}
                                            sizeClass="h-5 w-5 text-[8px]"
                                            style={{ backgroundColor: color, borderWidth: '1px', borderColor: 'rgb(15 23 42)' }}
                                          />
                                        )
                                      })}
                                      {meeting.participants.length > 4 && (
                                        <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black text-slate-400 border border-slate-900 bg-slate-800 shadow shrink-0">
                                          +{meeting.participants.length - 4}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => { setSelectedMeeting(meeting); setIsMeetingModalOpen(true) }}
                                    className="text-[10.5px] font-bold text-white transition-all duration-200 cursor-pointer bg-violet-600 hover:bg-violet-500 border border-violet-500/20 px-3 py-1.5 rounded-lg shadow-md shadow-violet-600/10"
                                  >
                                    Chi tiết <span className="text-[11px]">→</span>
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Submission Tracking Grid */}
              <div className="glass-card p-6 rounded-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-400" /> Bảng Theo Dõi Chi Tiết
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Click ô xanh để xem nội dung. Mũi tên ▼ chỉ ngày hôm nay.</p>
                  </div>
                  <div className="flex items-center gap-2 no-print">
                    {[7, 14, 30].map((size) => (
                      <button key={size} onClick={() => setDateRangeSize(size)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${dateRangeSize === size ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900 border border-white/5'}`}>
                        {size} ngày
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase w-44 sticky left-0 bg-slate-900/95 z-10">Thành viên</th>
                        {datesList.map((dateStr) => (
                          <th key={dateStr} className={`py-2 px-2 text-xs font-semibold text-center min-w-[48px] ${isToday(dateStr) ? 'text-violet-400' : 'text-slate-500'}`}>
                            <span className="block text-[9px] uppercase">{getDayName(dateStr)}</span>
                            <span className={`block mt-0.5 font-black ${isToday(dateStr) ? 'text-violet-400' : 'text-slate-400'}`}>{formatHeaderDate(dateStr)}</span>
                            {isToday(dateStr) && <span className="block text-[8px] text-violet-500 font-bold">▼</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member, mIdx) => {
                        const submittedCount = datesList.filter(d => findReport(member.id, d)).length
                        const memberColor = MEMBER_COLORS[mIdx % MEMBER_COLORS.length]
                        return (
                          <tr key={member.id} className="border-b border-white/5 hover:bg-white/[0.015]">
                            <td className="py-3 px-4 sticky left-0 bg-slate-950 z-10">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border shrink-0"
                                  style={{ background: `${memberColor}20`, color: memberColor, borderColor: `${memberColor}40` }}>
                                  {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs text-white truncate max-w-[90px]">{member.full_name}</div>
                                  <div className="text-[10px] text-slate-500">{submittedCount}/{datesList.length} ngày</div>
                                </div>
                              </div>
                            </td>
                            {datesList.map((dateStr) => {
                              const report = findReport(member.id, dateStr)
                              const late = isReportLate(report)
                              return (
                                <td key={dateStr} className={`py-2 px-2 text-center ${isToday(dateStr) ? 'bg-violet-500/5' : ''}`}>
                                  {report ? (
                                    <button onClick={() => { setSelectedReport(report); setSelectedMemberName(member.full_name); setIsModalOpen(true) }}
                                      className={`no-print mx-auto flex h-6 w-6 items-center justify-center rounded-md border transition-all cursor-pointer ${
                                        late 
                                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                      }`}
                                      title={late ? `Nộp muộn của ${member.full_name} (${formatSubmissionTime(report.created_at)})` : `Đúng hạn của ${member.full_name} (${formatSubmissionTime(report.created_at)})`}>
                                      {late ? <Clock className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                    </button>
                                  ) : (
                                    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/5 border border-rose-500/10 text-rose-400/50">
                                      <XCircle className="h-3.5 w-3.5" />
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
                <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Đúng hạn (click xem)</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-400" /> Nộp muộn (click xem)</span>
                  <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-rose-400/50" /> Chưa nộp</span>
                  <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Mũi tên ▼ chỉ ngày hôm nay</span>
                </div>
              </div>

              {/* Member Progress Summary */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-5 border-b border-white/5 pb-4">📋 Tóm tắt hoàn thành ({dateRangeSize} ngày)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {members.map((member, mIdx) => {
                    const submitted = datesList.filter(d => findReport(member.id, d)).length
                    const pct = datesList.length > 0 ? Math.round((submitted / datesList.length) * 100) : 0
                    const color = MEMBER_COLORS[mIdx % MEMBER_COLORS.length]
                    return (
                      <div key={member.id} className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black border shrink-0"
                            style={{ background: `${color}20`, color, borderColor: `${color}40` }}>
                            {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-white truncate">{member.full_name}</div>
                            <div className="text-xs text-slate-400">{submitted}/{datesList.length} ngày đã nộp</div>
                          </div>
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${pct === 100 ? 'bg-emerald-500/20 text-emerald-400' : pct >= 50 ? 'bg-violet-500/20 text-violet-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          </div>
        </main>

        {/* Report Detail Modal */}
        {isModalOpen && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm no-print" onClick={() => setIsModalOpen(false)}>
            <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Báo cáo tiến độ</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isReportLate(selectedReport) 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isReportLate(selectedReport) 
                        ? `Nộp muộn (${formatSubmissionTime(selectedReport.created_at)})` 
                        : `Đúng hạn (${formatSubmissionTime(selectedReport.created_at)})`}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white mt-0.5">{selectedMemberName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(selectedReport.report_date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center font-bold transition-colors cursor-pointer">✕</button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {[
                  { label: '✅ Hôm nay đã làm', content: selectedReport.today_tasks, required: true },
                  { label: '📚 Học được gì', content: selectedReport.lessons_learned, required: false },
                  { label: '🔧 Vấn đề & Giải pháp', content: selectedReport.problems_and_solutions, required: false },
                  { label: '🗓️ Ngày mai sẽ làm', content: selectedReport.next_day_plan, required: true },
                ].map((section, i) => (
                  section.content ? (
                    <div key={i} className={i > 0 ? 'border-t border-white/5 pt-4' : ''}>
                      <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">{section.label}</h4>
                      <div className="bg-slate-900/80 rounded-xl p-5 border border-white/10 shadow-lg">
                        <p className="text-[14.5px] text-slate-100 whitespace-pre-wrap leading-relaxed">{section.content}</p>
                      </div>
                    </div>
                  ) : null
                ))}

                {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                  <div className="border-t border-white/5 pt-4">
                    <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-3">📸 Ảnh minh chứng kết quả ({selectedReport.attachments.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedReport.attachments.map((img, idx) => (
                        <div 
                          key={idx} 
                          className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-md group cursor-zoom-in"
                          onClick={() => {
                            setLightboxImages(selectedReport.attachments!)
                            setLightboxIndex(idx)
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={img} 
                            alt={`Minh chứng ${idx + 1}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 py-1 text-[10px] text-center text-slate-300 font-medium">
                            Ảnh {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-white/5 bg-slate-900/40 flex justify-end">
                <button onClick={() => setIsModalOpen(false)}
                  className="bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all cursor-pointer border border-white/5">
                  Đóng lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Group Meeting Detail Modal */}
        {isMeetingModalOpen && selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm no-print" onClick={() => { setIsMeetingModalOpen(false); setSelectedMeeting(null); }}>
            <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Biên bản họp nhóm định kỳ</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {selectedMeeting.meeting_time.substring(0, 5)} ({selectedMeeting.duration_minutes} phút)
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white mt-1">
                    Họp Nhóm Tuần - Ngày {new Date(selectedMeeting.meeting_date + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lập bởi: <span className="font-semibold text-slate-300">{members.find(m => m.id === selectedMeeting.created_by)?.full_name || 'Thành viên'}</span>
                  </p>
                </div>
                <button onClick={() => { setIsMeetingModalOpen(false); setSelectedMeeting(null); }} className="text-slate-400 hover:text-white h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center font-bold transition-colors cursor-pointer">✕</button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* Participants */}
                <div>
                  <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">👥 Thành viên tham gia</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeeting.participants.map((pId: string) => {
                      const member = members.find(m => m.id === pId)
                      const name = member?.full_name || 'Thành viên'
                      const memberIndex = members.findIndex(m => m.id === pId)
                      const color = memberIndex !== -1 ? MEMBER_COLORS[memberIndex % MEMBER_COLORS.length] : '#8b5cf6'
                      return (
                        <div key={pId} className="flex items-center gap-1.5 bg-slate-900 border border-white/5 rounded-full pl-1.5 pr-3 py-1 text-xs text-slate-200">
                          <UserAvatar
                            avatarUrl={member?.avatar_url}
                            fullName={name}
                            sizeClass="h-4.5 w-4.5 text-[8px]"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium">{name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">📝 1. Nội dung trao đổi & Kết quả</h4>
                  <div className="bg-slate-900/80 rounded-xl p-5 border border-white/10 shadow-lg">
                    <p className="text-[14.5px] text-slate-100 whitespace-pre-wrap leading-relaxed">{selectedMeeting.content}</p>
                  </div>
                </div>

                {/* Difficulties and Solutions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">⚠️ 2. Khó khăn gặp phải</h4>
                    <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-4 min-h-[100px] shadow-sm">
                      <p className="text-[13.5px] text-rose-100 whitespace-pre-wrap leading-relaxed">{selectedMeeting.difficulties || 'Không có ghi nhận khó khăn.'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">💡 3. Giải pháp đề xuất</h4>
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 min-h-[100px] shadow-sm">
                      <p className="text-[13.5px] text-emerald-100 whitespace-pre-wrap leading-relaxed">{selectedMeeting.solutions || 'Không có đề xuất giải pháp mới.'}</p>
                    </div>
                  </div>
                </div>

                {/* Task assignments */}
                {selectedMeeting.assignments && selectedMeeting.assignments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">🎯 4. Phân công công việc tiếp theo</h4>
                    <div className="bg-slate-900/85 border border-white/10 rounded-xl overflow-hidden shadow-md">
                      <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-slate-950/40">
                            <th className="py-3 px-4 font-bold text-slate-300 w-1/3">Thành viên</th>
                            <th className="py-3 px-4 font-bold text-slate-300">Nhiệm vụ được giao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMeeting.assignments.map((as: any, idx: number) => {
                            const member = members.find(m => m.id === as.user_id)
                            const name = member?.full_name || 'Thành viên'
                            const memberIndex = members.findIndex(m => m.id === as.user_id)
                            const color = memberIndex !== -1 ? MEMBER_COLORS[memberIndex % MEMBER_COLORS.length] : '#8b5cf6'
                            return (
                              <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                  {name}
                                </td>
                                <td className="py-3.5 px-4 text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                                  {as.task}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5 bg-slate-900/40 flex justify-end">
                <button onClick={() => { setIsMeetingModalOpen(false); setSelectedMeeting(null); }}
                  className="bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all cursor-pointer border border-white/5">
                  Đóng lại
                </button>
              </div>
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
    </>
  )
}

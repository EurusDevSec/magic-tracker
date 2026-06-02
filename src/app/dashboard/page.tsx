'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Legend, LabelList
} from 'recharts'
import {
  Users, CheckCircle, XCircle, TrendingUp, FileText,
  Loader2, Calendar, Info, Download, Printer
} from 'lucide-react'

type Profile = { id: string; email: string; full_name: string; avatar_url: string | null; role: string }
type Report = {
  id: string; user_id: string; report_date: string
  today_tasks: string; lessons_learned: string | null
  problems_and_solutions: string | null; next_day_plan: string
}

const MEMBER_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#3b82f6', '#84cc16', '#f97316', '#a78bfa'
]
const PIE_COLORS = ['#8b5cf6', '#1e293b']

// Custom tooltip for member bar chart
const MemberBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 shadow-xl text-xs">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.fill }}>
            {p.name}: <span className="font-bold text-white">{p.value} ngày</span>
          </p>
        ))}
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

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // Generate dates: oldest first (today on right)
  useEffect(() => {
    const list: string[] = []
    for (let i = dateRangeSize - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      list.push(d.toLocaleDateString('en-CA'))
    }
    setDatesList(list)
  }, [dateRangeSize])

  const fetchDashboardData = useCallback(async () => {
    if (!user || datesList.length === 0) return
    setFetching(true)
    try {
      const [profilesRes, reportsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('reports').select('*')
          .gte('report_date', datesList[0])
          .lte('report_date', datesList[datesList.length - 1])
      ])
      setMembers(profilesRes.data || [])
      setReports(reportsRes.data || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setFetching(false)
    }
  }, [user, datesList, supabase])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  const findReport = (userId: string, dateStr: string) =>
    reports.find(r => r.user_id === userId && r.report_date === dateStr)

  const todayStr = new Date().toLocaleDateString('en-CA')
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
                  { label: 'Tỷ lệ nộp hôm nay', value: `${todayRate}%`, icon: TrendingUp, sub: `${submittedToday}/${totalMembers} người` },
                  { label: 'Báo cáo hôm nay', value: `${submittedToday}/${totalMembers}`, icon: FileText, sub: 'Đã nộp báo cáo' },
                  { label: 'Tổng kỳ này', value: reports.length, icon: Calendar, sub: `Trong ${dateRangeSize} ngày qua` },
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
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} domain={[0, totalMembers || 1]} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#c4b5fd' }} itemStyle={{ color: '#a78bfa' }}
                        formatter={((v: unknown) => [`${v ?? 0} báo cáo`, '']) as any} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="count" position="top" style={{ fill: '#c4b5fd', fontSize: 11, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Today pie */}
                <div className="glass-card p-6 rounded-2xl flex flex-col">
                  <h3 className="text-sm font-bold text-white mb-2">🍩 Hôm nay ({new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})</h3>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={65} strokeWidth={0}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                          itemStyle={{ color: '#c4b5fd' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-1">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                          {d.name}: <span className="font-bold text-white">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-Member Stacked Bar Chart */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-1">👤 Tiến độ nộp theo từng người ({dateRangeSize} ngày)</h3>
                <p className="text-xs text-slate-500 mb-5">Cột xanh = Đã nộp, Cột đỏ = Còn thiếu</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={memberChartData} margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-20} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} domain={[0, dateRangeSize]} />
                    <Tooltip content={<MemberBarTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 12 }} />
                    <Bar dataKey="submitted" name="Đã nộp" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]}>
                      <LabelList dataKey="submitted" position="center" style={{ fill: '#fff', fontSize: 10, fontWeight: 700 }} />
                    </Bar>
                    <Bar dataKey="missing" name="Còn thiếu" stackId="a" fill="#1e293b" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="missing" position="center" style={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        formatter={((v: unknown) => (Number(v) > 0 ? v : '')) as any} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Submission Tracking Grid */}
              <div className="glass-card p-6 rounded-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-400" /> Bảng Theo Dõi Chi Tiết
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Click ô xanh để xem nội dung. Cột phải = hôm nay.</p>
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
                              return (
                                <td key={dateStr} className={`py-2 px-2 text-center ${isToday(dateStr) ? 'bg-violet-500/5' : ''}`}>
                                  {report ? (
                                    <button onClick={() => { setSelectedReport(report); setSelectedMemberName(member.full_name); setIsModalOpen(true) }}
                                      className="no-print mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                                      title={`Xem báo cáo của ${member.full_name}`}>
                                      <CheckCircle className="h-3.5 w-3.5" />
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
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Đã nộp (click xem)</span>
                  <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-rose-400/50" /> Chưa nộp</span>
                  <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Cột phải = Hôm nay</span>
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
        </main>

        {/* Report Detail Modal */}
        {isModalOpen && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm no-print" onClick={() => setIsModalOpen(false)}>
            <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Báo cáo tiến độ</span>
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
                      <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">{section.label}</h4>
                      <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5">
                        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{section.content}</p>
                      </div>
                    </div>
                  ) : null
                ))}
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
      </div>
    </>
  )
}

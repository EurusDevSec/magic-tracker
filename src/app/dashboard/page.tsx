'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid
} from 'recharts'
import {
  Users, CheckCircle, XCircle, TrendingUp, FileText,
  Loader2, Calendar, Info, Download, ChevronDown, ChevronUp
} from 'lucide-react'

type Profile = { id: string; email: string; full_name: string; avatar_url: string | null; role: string }
type Report = {
  id: string; user_id: string; report_date: string
  today_tasks: string; lessons_learned: string | null
  problems_and_solutions: string | null; next_day_plan: string
}

const PIE_COLORS = ['#8b5cf6', '#334155']

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [members, setMembers] = useState<Profile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [fetching, setFetching] = useState(true)
  const [dateRangeSize, setDateRangeSize] = useState(7)
  const [datesList, setDatesList] = useState<string[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // Generate dates list - NEWEST FIRST (today on the left)
  useEffect(() => {
    const list: string[] = []
    for (let i = 0; i < dateRangeSize; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      list.push(d.toLocaleDateString('en-CA'))
    }
    setDatesList(list) // newest first
  }, [dateRangeSize])

  const fetchDashboardData = useCallback(async () => {
    if (!user || datesList.length === 0) return
    setFetching(true)
    try {
      const { data: profilesData } = await supabase.from('profiles').select('*').order('full_name')
      setMembers(profilesData || [])

      const startDate = datesList[datesList.length - 1] // oldest
      const endDate = datesList[0]                       // newest (today)

      const { data: reportsData } = await supabase
        .from('reports').select('*')
        .gte('report_date', startDate)
        .lte('report_date', endDate)
      setReports(reportsData || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setFetching(false)
    }
  }, [user, datesList, supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const findReport = (userId: string, dateStr: string) =>
    reports.find(r => r.user_id === userId && r.report_date === dateStr)

  const todayStr = new Date().toLocaleDateString('en-CA')
  const totalMembers = members.length
  const submittedToday = reports.filter(r => r.report_date === todayStr).length
  const todayRate = totalMembers > 0 ? Math.round((submittedToday / totalMembers) * 100) : 0

  // Chart data: bar chart per day
  const barChartData = [...datesList].reverse().map(dateStr => {
    const d = new Date(dateStr)
    const label = d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })
    const count = reports.filter(r => r.report_date === dateStr).length
    return { label, count }
  })

  // Pie chart data: today's rate
  const pieData = [
    { name: 'Đã nộp', value: submittedToday },
    { name: 'Chưa nộp', value: Math.max(0, totalMembers - submittedToday) }
  ]

  // Export CSV
  const exportCSV = () => {
    const sortedDates = [...datesList].reverse()
    const headers = ['Thành viên', 'Email', ...sortedDates]
    const rows = members.map(m => {
      const cells = sortedDates.map(d => findReport(m.id, d) ? 'Đã nộp' : 'Chưa nộp')
      return [m.full_name, m.email, ...cells]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bao-cao-tien-do-${todayStr}.csv`
    a.click()
  }

  const formatHeaderDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })
  }
  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { weekday: 'short' })
  }
  const isToday = (dateStr: string) => dateStr === todayStr

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
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Title */}
        <div className="mb-8 border-b border-white/5 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">📊 Bảng Tổng Quan</h1>
          <p className="text-slate-400 text-sm mt-1">Theo dõi tiến độ báo cáo hàng ngày của toàn bộ thành viên ETI.</p>
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
                { label: 'Tổng thành viên', value: totalMembers, icon: Users, color: 'violet', sub: 'Toàn bộ tài khoản' },
                { label: 'Tỷ lệ nộp hôm nay', value: `${todayRate}%`, icon: TrendingUp, color: 'violet', sub: `${submittedToday}/${totalMembers} người` },
                { label: 'Số báo cáo hôm nay', value: `${submittedToday}/${totalMembers}`, icon: FileText, color: 'violet', sub: 'Đã nộp báo cáo' },
                { label: 'Tổng báo cáo kỳ này', value: reports.length, icon: Calendar, color: 'violet', sub: `Trong ${dateRangeSize} ngày qua` },
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
              {/* Bar Chart */}
              <div className="glass-card p-6 rounded-2xl lg:col-span-2">
                <h3 className="text-base font-bold text-white mb-4">📈 Số báo cáo nộp theo ngày</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#c4b5fd' }}
                      itemStyle={{ color: '#a78bfa' }}
                      formatter={(v: number) => [`${v} báo cáo`, '']}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="glass-card p-6 rounded-2xl flex flex-col">
                <h3 className="text-base font-bold text-white mb-4">🍩 Hôm nay</h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        itemStyle={{ color: '#c4b5fd' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2">
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

            {/* Submission Tracking Grid */}
            <div className="glass-card p-6 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-violet-400" /> Bảng Theo Dõi Nộp Báo Cáo
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Click ô xanh để xem chi tiết. Hiển thị từ hôm nay về quá khứ.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Range Filters */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-white/5 p-1 rounded-xl">
                    {[7, 14, 30].map((size) => (
                      <button key={size} onClick={() => setDateRangeSize(size)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${dateRangeSize === size ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                        {size} ngày
                      </button>
                    ))}
                  </div>
                  {/* Export CSV */}
                  <button onClick={exportCSV}
                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-xl bg-violet-500/5 hover:bg-violet-500/10 transition-all cursor-pointer">
                    <Download className="h-3.5 w-3.5" /> Xuất CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase w-48 sticky left-0 bg-slate-900/90 z-10">Thành viên</th>
                      {datesList.map((dateStr) => (
                        <th key={dateStr} className={`py-3 px-2 text-xs font-semibold text-center min-w-[52px] ${isToday(dateStr) ? 'text-violet-400' : 'text-slate-400'}`}>
                          <span className="block text-[10px] text-slate-500 uppercase">{getDayName(dateStr)}</span>
                          <span className={`block mt-0.5 ${isToday(dateStr) ? 'text-violet-400 font-black' : ''}`}>{formatHeaderDate(dateStr)}</span>
                          {isToday(dateStr) && <span className="block text-[9px] text-violet-500 font-bold">Hôm nay</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const memberReports = datesList.filter(d => findReport(member.id, d))
                      const isExpanded = expandedMember === member.id

                      return (
                        <tr key={member.id} className="border-b border-white/5 hover:bg-white/[0.015] transition-colors">
                          <td className="py-3 px-4 sticky left-0 bg-slate-950 z-10">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-violet-500/10 text-violet-300 font-bold flex items-center justify-center text-xs border border-violet-500/20 shrink-0">
                                {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-sm text-white truncate max-w-[100px]">{member.full_name}</span>
                                  {member.role === 'admin' && (
                                    <span className="text-[9px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30 px-1.5 py-0.5 rounded-full shrink-0">Admin</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{memberReports.length}/{datesList.length} ngày</p>
                              </div>
                            </div>
                          </td>
                          {datesList.map((dateStr) => {
                            const report = findReport(member.id, dateStr)
                            return (
                              <td key={dateStr} className={`py-3 px-2 text-center ${isToday(dateStr) ? 'bg-violet-500/5' : ''}`}>
                                {report ? (
                                  <button onClick={() => { setSelectedReport(report); setSelectedMemberName(member.full_name); setIsModalOpen(true) }}
                                    className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
                                    title="Click để xem chi tiết">
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/5 border border-rose-500/15 text-rose-400/60">
                                    <XCircle className="h-4 w-4" />
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

              {members.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">Chưa có thành viên nào trong hệ thống.</div>
              )}

              <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Ô xanh: Đã nộp (click xem nội dung)</span>
                <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-rose-400/60" /> Ô đỏ: Chưa nộp</span>
                <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Cột bên trái = hôm nay</span>
              </div>
            </div>

            {/* Member Completion Summary */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                <h3 className="text-base font-bold text-white">👥 Tóm tắt hoàn thành theo thành viên</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {members.map(member => {
                  const submitted = datesList.filter(d => findReport(member.id, d)).length
                  const pct = datesList.length > 0 ? Math.round((submitted / datesList.length) * 100) : 0
                  const color = pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-violet-500' : 'bg-rose-500'
                  return (
                    <div key={member.id} className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="h-8 w-8 rounded-full bg-violet-500/10 text-violet-300 font-bold flex items-center justify-center text-xs border border-violet-500/20 shrink-0">
                          {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white truncate">{member.full_name}</div>
                          <div className="text-xs text-slate-400">{submitted}/{datesList.length} ngày đã nộp</div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct === 100 ? 'bg-emerald-500/20 text-emerald-400' : pct >= 50 ? 'bg-violet-500/20 text-violet-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}>

            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Báo cáo tiến độ</span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">{selectedMemberName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(selectedReport.report_date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center font-bold">✕</button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {[
                { label: '✅ Hôm nay đã làm', content: selectedReport.today_tasks },
                { label: '📚 Học được gì', content: selectedReport.lessons_learned },
                { label: '🔧 Vấn đề & Giải pháp', content: selectedReport.problems_and_solutions },
                { label: '🗓️ Ngày mai sẽ làm', content: selectedReport.next_day_plan },
              ].map((section, i) => (
                section.content ? (
                  <div key={i} className={i > 0 ? 'border-t border-white/5 pt-5' : ''}>
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
  )
}

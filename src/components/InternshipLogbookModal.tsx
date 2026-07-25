'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileText,
  Download,
  Printer,
  X,
  Loader2,
  Calendar,
  User,
  BookOpen,
  Award,
  Edit3,
  CheckCircle2,
  Sparkles,
  Info,
  Filter,
  Users
} from 'lucide-react'

interface InternshipLogbookModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  userEmail?: string
}

interface ReportItem {
  id: string
  user_id: string
  report_date: string
  today_tasks: string
  lessons_learned?: string | null
  problems_and_solutions?: string | null
  next_day_plan?: string
  created_at: string
}

interface WeekGroup {
  weekNum: number
  startDateStr: string // DD/MM/YYYY
  endDateStr: string   // DD/MM/YYYY
  rawStartDate: string // YYYY-MM-DD
  rawEndDate: string   // YYYY-MM-DD
  tasks: string[]
  note: string
}

type PhaseFilterType = 'all' | 'dot1' | 'dot2' | 'custom'

const STORAGE_KEY_PREFIX = 'eti-logbook-info-'

export default function InternshipLogbookModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail
}: InternshipLogbookModalProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const printRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<ReportItem[]>([])
  
  // Member Switcher State
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [activeUserId, setActiveUserId] = useState<string>(userId)

  // Sync activeUserId when userId prop changes
  useEffect(() => {
    if (userId) {
      setActiveUserId(userId)
    }
  }, [userId])

  // Phase & Date Range Filter State
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilterType>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  
  // Custom Metadata State
  const DEFAULT_TOPIC = 'NGHIÊN CỨU VÀ TRIỂN KHAI HỆ SINH THÁI GIẢI PHÁP SỐ DOANH NGHIỆP TẠI CÔNG TY TNHH GIẢI PHÁP ETI'
  const [topicName, setTopicName] = useState(DEFAULT_TOPIC)
  const [mentorName, setMentorName] = useState('Nguyễn Minh Phụng')
  const [studentName, setStudentName] = useState(userName)
  const [studentCode, setStudentCode] = useState('2224802010279')
  const [className, setClassName] = useState('D22KTPM01')
  const [defaultNote, setDefaultNote] = useState('Hoàn thành tốt')
  const [customWeekNotes, setCustomWeekNotes] = useState<{ [weekNum: number]: string }>({})

  // Active view tab: 'preview' or 'edit_weeks'
  const [activeTab, setActiveTab] = useState<'preview' | 'edit_weeks'>('preview')

  // Fetch all profiles for member dropdown selection
  useEffect(() => {
    if (!isOpen) return
    const fetchProfiles = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').order('full_name')
        if (data && data.length > 0) {
          setAllProfiles(data)
          // Set student name if profile matched
          const currentP = data.find((p: any) => p.id === activeUserId)
          if (currentP) {
            setStudentName(currentP.full_name || currentP.email)
          }
        }
      } catch (e) {
        console.error('Error fetching profiles in logbook modal:', e)
      }
    }
    fetchProfiles()
  }, [isOpen, activeUserId])

  // Load saved metadata from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !activeUserId) return
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + activeUserId)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.topicName && parsed.topicName !== 'Hệ thống Quản lý Tiến độ ETI Tracker & Web Thương mại Điện tử') {
          setTopicName(parsed.topicName)
        } else {
          setTopicName(DEFAULT_TOPIC)
        }
        if (parsed.mentorName && parsed.mentorName !== 'ThS. Nguyễn Văn Phụng') {
          setMentorName(parsed.mentorName)
        } else {
          setMentorName('Nguyễn Minh Phụng')
        }
        if (parsed.studentName) setStudentName(parsed.studentName)
        if (parsed.studentCode) setStudentCode(parsed.studentCode)
        if (parsed.className) setClassName(parsed.className)
        if (parsed.defaultNote) setDefaultNote(parsed.defaultNote)
        if (parsed.customWeekNotes) setCustomWeekNotes(parsed.customWeekNotes)
      } catch (e) {
        console.error('Error loading logbook draft info:', e)
      }
    } else if (userName && activeUserId === userId) {
      setStudentName(userName)
    }
  }, [activeUserId, userId, userName])

  // Save metadata to localStorage
  const saveInfoDraft = (updatedProps: Partial<{
    topicName: string
    mentorName: string
    studentName: string
    studentCode: string
    className: string
    defaultNote: string
    customWeekNotes: { [weekNum: number]: string }
  }>) => {
    if (typeof window === 'undefined' || !activeUserId) return
    const current = {
      topicName,
      mentorName,
      studentName,
      studentCode,
      className,
      defaultNote,
      customWeekNotes,
      ...updatedProps
    }
    localStorage.setItem(STORAGE_KEY_PREFIX + activeUserId, JSON.stringify(current))
  }

  // Fetch ALL reports and group meetings for activeUserId across entire history
  useEffect(() => {
    if (!isOpen || !activeUserId) return

    const fetchAllData = async () => {
      setLoading(true)
      try {
        const [reportsRes, meetingsRes] = await Promise.all([
          supabase
            .from('reports')
            .select('*')
            .eq('user_id', activeUserId)
            .order('report_date', { ascending: true }),
          supabase
            .from('group_meetings')
            .select('*')
            .order('meeting_date', { ascending: true })
        ])

        if (reportsRes.error) throw reportsRes.error
        if (meetingsRes.error) throw meetingsRes.error

        const fetchedReports: ReportItem[] = reportsRes.data || []
        const fetchedMeetings: any[] = meetingsRes.data || []

        // Adjust group meetings held on Sunday to target Monday
        const adjustedMeetings = fetchedMeetings.map((meeting: any) => {
          const d = new Date(meeting.meeting_date + 'T00:00:00')
          if (d.getDay() === 0) { // Sunday
            d.setDate(d.getDate() + 1)
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const date = String(d.getDate()).padStart(2, '0')
            return {
              ...meeting,
              meeting_date: `${year}-${month}-${date}`
            }
          }
          return meeting
        })

        // Merge virtual reports from meetings for this user
        const finalReports = [...fetchedReports]
        
        adjustedMeetings.forEach((meeting: any) => {
          const dateStr = meeting.meeting_date
          if (meeting.participants?.includes(activeUserId)) {
            const hasReport = finalReports.some(r => r.report_date === dateStr)
            if (!hasReport) {
              const assignment = meeting.assignments?.find((a: any) => a.user_id === activeUserId)
              const userTask = assignment ? assignment.task : ''
              
              finalReports.push({
                id: `virtual-group-${meeting.id}`,
                user_id: activeUserId,
                report_date: dateStr,
                today_tasks: `[Báo cáo nhóm] Tham gia họp nhóm định kỳ.\n- Nội dung họp: ${meeting.content}`,
                lessons_learned: `Giải pháp đề xuất: ${meeting.solutions}`,
                problems_and_solutions: `Khó khăn từ họp nhóm: ${meeting.difficulties}`,
                next_day_plan: userTask || 'Theo phân công của họp nhóm.',
                created_at: meeting.created_at
              })
            }
          }
        })

        // Sort ascending by report_date
        finalReports.sort((a, b) => a.report_date.localeCompare(b.report_date))
        setReports(finalReports)
      } catch (err) {
        console.error('Error fetching reports for logbook:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [isOpen, activeUserId])

  // Filter reports by phase / date range
  const filteredReports = useMemo(() => {
    if (phaseFilter === 'dot1') {
      return reports.filter(r => r.report_date >= '2026-06-01' && r.report_date <= '2026-07-31')
    }
    if (phaseFilter === 'dot2') {
      return reports.filter(r => r.report_date >= '2026-08-01' && r.report_date <= '2026-10-31')
    }
    if (phaseFilter === 'custom') {
      return reports.filter(r => {
        if (customStartDate && r.report_date < customStartDate) return false
        if (customEndDate && r.report_date > customEndDate) return false
        return true
      })
    }
    return reports
  }, [reports, phaseFilter, customStartDate, customEndDate])

  // Format date helper: YYYY-MM-DD to DD/MM/YYYY
  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  // Group filtered reports by calendar week (Monday to Saturday/Sunday)
  const weekGroups = useMemo<WeekGroup[]>(() => {
    if (filteredReports.length === 0) return []

    const groupsMap: { [key: string]: { mondayStr: string; saturdayStr: string; sundayStr: string; reports: ReportItem[] } } = {}

    filteredReports.forEach((report) => {
      const d = new Date(report.report_date + 'T00:00:00')
      const dayOfWeek = d.getDay() // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
      
      // Calculate Monday of this week
      const monday = new Date(d)
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      monday.setDate(d.getDate() + diffToMonday)

      // Calculate Saturday of this week
      const saturday = new Date(monday)
      saturday.setDate(monday.getDate() + 5)

      // Calculate Sunday of this week
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      const mondayStr = monday.toLocaleDateString('en-CA')
      const saturdayStr = saturday.toLocaleDateString('en-CA')
      const sundayStr = sunday.toLocaleDateString('en-CA')

      if (!groupsMap[mondayStr]) {
        groupsMap[mondayStr] = {
          mondayStr,
          saturdayStr,
          sundayStr,
          reports: []
        }
      }

      groupsMap[mondayStr].reports.push(report)
    })

    // Sort weeks chronologically
    const sortedKeys = Object.keys(groupsMap).sort()

    return sortedKeys.map((weekKey, idx) => {
      const item = groupsMap[weekKey]
      const weekNum = idx + 1

      const sortedReports = item.reports.sort((a, b) => a.report_date.localeCompare(b.report_date))
      
      // Calculate standard week boundaries
      const firstReportDate = sortedReports[0].report_date
      
      // Start date: Monday of week or first report date for week 1
      const rawStartDate = (idx === 0 && firstReportDate > item.mondayStr) ? firstReportDate : item.mondayStr
      
      // Check if any report in this week is on Sunday
      const hasSundayReport = sortedReports.some(r => {
        const rd = new Date(r.report_date + 'T00:00:00')
        return rd.getDay() === 0
      })

      const rawEndDate = hasSundayReport ? item.sundayStr : item.saturdayStr

      // Extract tasks from all reports in this week
      const allTasks: string[] = []
      sortedReports.forEach((r) => {
        if (r.today_tasks) {
          const lines = r.today_tasks.split('\n')
          lines.forEach((line) => {
            let trimmed = line.trim()
            if (!trimmed) return
            // Filter out generic header prefixes
            if (trimmed.startsWith('[Báo cáo nhóm]')) {
              trimmed = trimmed.replace('[Báo cáo nhóm]', '').trim()
            }
            if (trimmed.startsWith('- Nội dung họp:')) {
              trimmed = trimmed.replace('- Nội dung họp:', '').trim()
            }
            // Strip leading bullet symbols
            trimmed = trimmed.replace(/^([•\-\*]+|\d+[\.\)])\s*/, '').trim()
            if (trimmed && !allTasks.includes(trimmed)) {
              allTasks.push(trimmed)
            }
          })
        }
      })

      if (allTasks.length === 0) {
        allTasks.push('Thực hiện các nhiệm vụ nghiên cứu và phát triển được giao.')
      }

      return {
        weekNum,
        startDateStr: formatDateVN(rawStartDate),
        endDateStr: formatDateVN(rawEndDate),
        rawStartDate,
        rawEndDate,
        tasks: allTasks,
        note: customWeekNotes[weekNum] || defaultNote
      }
    })
  }, [filteredReports, defaultNote, customWeekNotes])

  if (!isOpen) return null

  // Export as Word (.doc HTML format)
  const handleExportWord = () => {
    const tableRowsHtml = weekGroups.map(w => `
      <tr>
        <td style="text-align: center; vertical-align: middle; font-weight: bold; width: 8%;">${w.weekNum}</td>
        <td style="text-align: center; vertical-align: middle; width: 22%; font-size: 11pt;">
          ${w.startDateStr} <br/>đến <br/>${w.endDateStr}
        </td>
        <td style="vertical-align: top; width: 55%; padding: 6pt 8pt;">
          <ul style="margin: 0; padding-left: 14pt; line-height: 1.4;">
            ${w.tasks.map(t => `<li style="margin-bottom: 3pt;">${t}</li>`).join('')}
          </ul>
        </td>
        <td style="text-align: center; vertical-align: middle; width: 15%; font-size: 11pt;">
          ${w.note}
        </td>
      </tr>
    `).join('')

    const phaseTitleSuffix = phaseFilter === 'dot1' ? '_Dot_1' : phaseFilter === 'dot2' ? '_Dot_2' : ''

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Nhật Ký Thực Tập - ${studentName}</title>
        <style>
          @page Section1 { size: 210mm 297mm; margin: 20mm 20mm 20mm 20mm; }
          div.Section1 { page: Section1; }
          body { font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.3; color: #000; letter-spacing: normal; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15pt; }
          .header-table td { border: none; font-size: 11pt; vertical-align: top; text-align: center; }
          .title { font-size: 15pt; font-weight: bold; text-align: center; margin-top: 15pt; margin-bottom: 15pt; text-transform: uppercase; }
          .meta-info { margin-bottom: 15pt; line-height: 1.6; font-size: 12pt; }
          .meta-info table { width: 100%; border-collapse: collapse; }
          .meta-info td { border: none; padding: 2pt 0; }
          table.logbook { width: 100%; border-collapse: collapse; margin-top: 10pt; }
          table.logbook th, table.logbook td { border: 1px solid #000; padding: 6pt 8pt; font-size: 12pt; }
          table.logbook th { font-weight: bold; text-align: center; background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table class="header-table">
            <tr>
              <td style="width: 45%;">
                UBND THÀNH PHỐ HỒ CHÍ MINH<br/>
                <b>TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</b>
              </td>
              <td style="width: 55%;">
                <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/>
                <u><b>Độc lập – Tự do – Hạnh phúc</b></u>
              </td>
            </tr>
          </table>

          <div class="title">NHẬT KÝ THỰC TẬP ${phaseFilter === 'dot1' ? '(ĐỢT 1)' : phaseFilter === 'dot2' ? '(ĐỢT 2)' : ''}</div>

          <div class="meta-info">
            <table>
              <tr>
                <td style="width: 22%;"><b>1. Tên đề tài:</b></td>
                <td>${topicName}</td>
              </tr>
              <tr>
                <td><b>2. Cán bộ hướng dẫn:</b></td>
                <td>${mentorName}</td>
              </tr>
              <tr>
                <td><b>3. Sinh viên thực hiện:</b></td>
                <td><b>${studentName}</b></td>
              </tr>
              <tr>
                <td colspan="2">
                  <table style="width: 100%;">
                    <tr>
                      <td style="width: 50%;"><b>MSSV:</b> ${studentCode}</td>
                      <td style="width: 50%;"><b>Lớp:</b> ${className}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>

          <table class="logbook">
            <thead>
              <tr>
                <th style="width: 8%;">Tuần lễ</th>
                <th style="width: 22%;">Từ ngày đến ngày</th>
                <th style="width: 55%;">Nội dung</th>
                <th style="width: 15%;">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `Nhat_Ky_Thuc_Tap${phaseTitleSuffix}_${studentName.replace(/\s+/g, '_')}_${studentCode}.doc`
    a.click()
  }

  // Print as PDF / Native Print
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* CSS Rules for A4 Print */}
      <style>{`
        .vn-paper-font {
          font-family: "Times New Roman", Times, serif !important;
          letter-spacing: normal !important;
          word-spacing: normal !important;
          font-variant-ligatures: normal !important;
        }
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            font-family: "Times New Roman", Times, serif !important;
          }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto no-print">
        <div className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  📘 Xuất Nhật Ký Thực Tập <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">Mẫu Phụ Lục 4 - TDMU</span>
                </h3>
                <p className="text-xs text-slate-400">Tự động tổng hợp báo cáo hàng ngày theo tuần chuẩn mẫu ĐH Thủ Dầu Một.</p>
              </div>
            </div>

            {/* Action controls */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleExportWord}
                disabled={loading || weekGroups.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> Xuất File Word (.doc)
              </button>
              <button
                onClick={handlePrint}
                disabled={loading || weekGroups.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" /> In / PDF
              </button>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-white/5 bg-slate-950/30 px-6 pt-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Xem Bản Thảo (Paper Preview)
            </button>
            <button
              onClick={() => setActiveTab('edit_weeks')}
              className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'edit_weeks'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" /> Tùy Chỉnh Thông Tin & Ghi Chú ({weekGroups.length} tuần)
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                <p className="text-xs text-slate-400 font-semibold">Đang tổng hợp báo cáo và phân nhóm theo tuần...</p>
              </div>
            ) : (
              <>
                {/* PHASE / DATE RANGE & MEMBER FILTER BAR */}
                <div className="glass-card p-4 rounded-xl space-y-3 border border-white/5 bg-slate-950/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5" /> Chọn Thành Viên & Đợt Thực Tập
                    </div>
                    
                    {/* Member Select Dropdown */}
                    {allProfiles.length > 0 && (
                      <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
                        <Users className="h-4 w-4 text-violet-400 shrink-0" />
                        <span className="text-slate-400 font-semibold shrink-0">Nhật ký của:</span>
                        <select
                          value={activeUserId}
                          onChange={(e) => {
                            const selectedId = e.target.value
                            setActiveUserId(selectedId)
                            const p = allProfiles.find(item => item.id === selectedId)
                            if (p) {
                              setStudentName(p.full_name || p.email)
                            }
                          }}
                          className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-1"
                        >
                          {allProfiles.map(p => (
                            <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                              {p.full_name || p.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[
                      { key: 'all', label: '🌟 Tất cả (Toàn bộ)' },
                      { key: 'dot1', label: '📅 Đợt 1 (Tháng 6 - Tháng 7)' },
                      { key: 'dot2', label: '📅 Đợt 2 (Tháng 8 - Tháng 10)' },
                      { key: 'custom', label: '🎯 Tùy chọn khoảng ngày' },
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setPhaseFilter(btn.key as PhaseFilterType)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          phaseFilter === btn.key
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25 border border-violet-500/50'
                            : 'text-slate-400 hover:text-white bg-slate-900 border border-white/5 hover:border-white/15'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Pickers if Custom Phase Selected */}
                  {phaseFilter === 'custom' && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5 text-xs animate-fadeIn">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-semibold">Từ ngày:</span>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-semibold">Đến ngày:</span>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {weekGroups.length === 0 ? (
                  <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Info className="h-12 w-12 text-slate-600" />
                    <h4 className="text-base font-bold text-white">Không có báo cáo trong đợt thực tập này</h4>
                    <p className="text-xs text-slate-400 max-w-sm">Không tìm thấy báo cáo tiến độ nào trong mốc thời gian đã chọn. Hãy thử đổi sang đợt thực tập khác hoặc chọn thành viên khác.</p>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: Preview Mode */}
                    {activeTab === 'preview' && (
                      <div className="space-y-4">
                        {/* Inline Metadata Edit Controls Bar */}
                        <div className="glass-card p-4 rounded-xl space-y-3 border border-white/5 bg-slate-950/40">
                          <div className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Edit3 className="h-3.5 w-3.5" /> Nhập Thông Tin Hành Chính (Tự Động Lưu)
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">Tên đề tài</label>
                              <input
                                type="text"
                                value={topicName}
                                onChange={(e) => { setTopicName(e.target.value); saveInfoDraft({ topicName: e.target.value }) }}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:border-violet-500"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">Cán bộ hướng dẫn</label>
                              <input
                                type="text"
                                value={mentorName}
                                onChange={(e) => { setMentorName(e.target.value); saveInfoDraft({ mentorName: e.target.value }) }}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:border-violet-500"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">Sinh viên thực hiện</label>
                              <input
                                type="text"
                                value={studentName}
                                onChange={(e) => { setStudentName(e.target.value); saveInfoDraft({ studentName: e.target.value }) }}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:border-violet-500"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">MSSV</label>
                              <input
                                type="text"
                                value={studentCode}
                                onChange={(e) => { setStudentCode(e.target.value); saveInfoDraft({ studentCode: e.target.value }) }}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:border-violet-500"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">Lớp</label>
                              <input
                                type="text"
                                value={className}
                                onChange={(e) => { setClassName(e.target.value); saveInfoDraft({ className: e.target.value }) }}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:border-violet-500"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1">Đánh giá chung (Ghi chú)</label>
                              <input
                                type="text"
                                value={defaultNote}
                                onChange={(e) => { setDefaultNote(e.target.value); saveInfoDraft({ defaultNote: e.target.value }) }}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:border-violet-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Paper Document Preview Box */}
                        <div 
                          className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl border border-slate-200 print-area text-sm leading-normal vn-paper-font"
                          style={{ fontFamily: '"Times New Roman", Times, serif', letterSpacing: 'normal' }}
                        >
                          {/* Document Header */}
                          <div className="flex justify-between items-start mb-6 text-center text-xs leading-tight">
                            <div className="w-[45%]">
                              UBND THÀNH PHỐ HỒ CHÍ MINH<br />
                              <strong className="text-sm">TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT</strong>
                            </div>
                            <div className="w-[50%]">
                              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                              <span className="underline font-bold">Độc lập – Tự do – Hạnh phúc</span>
                            </div>
                          </div>

                          {/* Title */}
                          <h2 className="text-center font-bold text-lg mb-6 uppercase">
                            NHẬT KÝ THỰC TẬP {phaseFilter === 'dot1' ? '(ĐỢT 1)' : phaseFilter === 'dot2' ? '(ĐỢT 2)' : ''}
                          </h2>

                          {/* Info Metadata */}
                          <div className="space-y-1.5 mb-6 text-sm">
                            <div className="flex">
                              <span className="w-36 font-semibold shrink-0">1. Tên đề tài:</span>
                              <span className="flex-1">{topicName}</span>
                            </div>
                            <div className="flex">
                              <span className="w-36 font-semibold shrink-0">2. Cán bộ hướng dẫn:</span>
                              <span className="flex-1">{mentorName}</span>
                            </div>
                            <div className="flex">
                              <span className="w-36 font-semibold shrink-0">3. Sinh viên thực hiện:</span>
                              <span className="flex-1 font-bold">{studentName}</span>
                            </div>
                            <div className="flex justify-between max-w-md pt-0.5">
                              <div><span className="font-semibold">MSSV:</span> {studentCode}</div>
                              <div><span className="font-semibold">Lớp:</span> {className}</div>
                            </div>
                          </div>

                          {/* Logbook Table */}
                          <table className="w-full border-collapse border border-slate-900 text-xs leading-relaxed">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-900 text-center font-bold">
                                <th className="border border-slate-900 p-2 w-[8%]">Tuần lễ</th>
                                <th className="border border-slate-900 p-2 w-[22%]">Từ ngày đến ngày</th>
                                <th className="border border-slate-900 p-2 w-[55%]">Nội dung</th>
                                <th className="border border-slate-900 p-2 w-[15%]">Ghi chú</th>
                              </tr>
                            </thead>
                            <tbody>
                              {weekGroups.map((w) => (
                                <tr key={w.weekNum} className="border-b border-slate-900">
                                  <td className="border border-slate-900 p-2.5 text-center font-bold align-middle">
                                    {w.weekNum}
                                  </td>
                                  <td className="border border-slate-900 p-2.5 text-center align-middle text-[11px]">
                                    {w.startDateStr}<br />đến<br />{w.endDateStr}
                                  </td>
                                  <td className="border border-slate-900 p-2.5 align-top">
                                    <ul className="list-disc list-inside space-y-1 pl-1">
                                      {w.tasks.map((task, tIdx) => (
                                        <li key={tIdx} className="leading-snug">{task}</li>
                                      ))}
                                    </ul>
                                  </td>
                                  <td className="border border-slate-900 p-2.5 text-center align-middle font-medium">
                                    {w.note}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Edit Weeks Detail */}
                    {activeTab === 'edit_weeks' && (
                      <div className="space-y-4">
                        <div className="text-xs text-slate-400 bg-violet-500/10 border border-violet-500/20 p-3 rounded-xl flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
                          <span>Dữ liệu nội dung công việc được tự động trích xuất từ <strong>{filteredReports.length} bản báo cáo</strong> của <strong>{studentName}</strong>. Bạn có thể thay đổi đánh giá ghi chú cho từng tuần tại đây.</span>
                        </div>

                        <div className="space-y-3">
                          {weekGroups.map((w) => (
                            <div key={w.weekNum} className="glass-card p-4 rounded-xl border border-white/5 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="h-6 w-6 rounded-full bg-violet-600/30 text-violet-300 font-black text-xs flex items-center justify-center border border-violet-500/30">
                                    {w.weekNum}
                                  </span>
                                  <span className="font-bold text-white text-sm">Tuần {w.weekNum}</span>
                                  <span className="text-xs text-slate-400 font-medium">({w.startDateStr} đến {w.endDateStr})</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-slate-400">Ghi chú tuần:</span>
                                  <input
                                    type="text"
                                    value={w.note}
                                    onChange={(e) => {
                                      const updated = { ...customWeekNotes, [w.weekNum]: e.target.value }
                                      setCustomWeekNotes(updated)
                                      saveInfoDraft({ customWeekNotes: updated })
                                    }}
                                    className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-violet-500 w-36"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1 pl-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nội dung công việc tuần:</span>
                                <ul className="list-disc list-inside text-xs text-slate-200 space-y-1">
                                  {w.tasks.map((t, idx) => (
                                    <li key={idx} className="leading-relaxed">{t}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

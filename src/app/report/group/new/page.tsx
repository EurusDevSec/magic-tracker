'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import UserAvatar from '@/components/UserAvatar'
import {
  Users, Calendar, Clock, BookOpen, AlertTriangle,
  Lightbulb, ClipboardList, ChevronLeft, ChevronRight, Save, Loader2,
  Image, X
} from 'lucide-react'
import Link from 'next/link'

type Profile = { id: string; email: string; full_name: string; avatar_url: string | null; role: string }
type Assignment = { user_id: string; task: string }

export default function NewGroupMeetingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [fetchingProfiles, setFetchingProfiles] = useState(true)
  const [fetchingMeeting, setFetchingMeeting] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // Form fields
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('19:00')
  const [duration, setDuration] = useState(30) // default 30 mins
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  const [content, setContent] = useState('')
  const [difficulties, setDifficulties] = useState('')
  const [solutions, setSolutions] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [compressing, setCompressing] = useState(false)

  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // Get edit parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setEditId(params.get('edit'))
    }
  }, [])

  // Set default date to today
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (!urlParams.get('edit')) {
        const todayStr = new Date().toLocaleDateString('en-CA')
        setMeetingDate(todayStr)
      }
    }
  }, [])

  // Fetch profiles for participant checklist
  useEffect(() => {
    if (!user) return

    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('full_name')
        if (error) throw error
        setProfiles(data || [])

        // Auto-select current user as participant
        const urlParams = new URLSearchParams(window.location.search)
        if (!urlParams.get('edit')) {
          setSelectedParticipants([user.id])
        }
      } catch (err) {
        console.error('Error fetching profiles:', err)
      } finally {
        setFetchingProfiles(false)
      }
    }

    fetchProfiles()
  }, [user])

  // Fetch meeting for edit
  useEffect(() => {
    if (!editId || !user) return

    const fetchMeeting = async () => {
      setFetchingMeeting(true)
      try {
        const { data, error } = await supabase
          .from('group_meetings')
          .select('*')
          .eq('id', editId)
          .single()

        if (error) throw error
        if (data) {
          if (data.created_by !== user.id) {
            setErrorMsg('Bạn không có quyền chỉnh sửa ghi chép họp nhóm này.')
            return
          }

          setMeetingDate(data.meeting_date)
          setMeetingTime(data.meeting_time ? data.meeting_time.substring(0, 5) : '19:00')
          setDuration(data.duration_minutes)
          setSelectedParticipants(data.participants || [])
          setContent(data.content)
          setDifficulties(data.difficulties)
          setSolutions(data.solutions)
          setAssignments(data.assignments || [])
          setAttachments(data.attachments || [])
        }
      } catch (err) {
        console.error('Error fetching meeting:', err)
        setErrorMsg('Lỗi khi tải thông tin buổi họp.')
      } finally {
        setFetchingMeeting(false)
      }
    }

    fetchMeeting()
  }, [editId, user])

  // Sync assignments array when selectedParticipants changes
  useEffect(() => {
    setAssignments(prev => {
      const filtered = prev.filter(a => selectedParticipants.includes(a.user_id))
      selectedParticipants.forEach(pId => {
        if (!filtered.some(a => a.user_id === pId)) {
          filtered.push({ user_id: pId, task: '' })
        }
      })
      return filtered
    })
  }, [selectedParticipants])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileList = Array.from(files)
    if (attachments.length + fileList.length > 5) {
      alert('Bạn chỉ được phép đính kèm tối đa 5 ảnh minh chứng!')
      return
    }

    setCompressing(true)
    let processedCount = 0

    fileList.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert(`Tệp "${file.name}" không phải là ảnh hợp lệ!`)
        processedCount++
        if (processedCount === fileList.length) setCompressing(false)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 1200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75)
            setAttachments(prev => {
              if (prev.length < 5) {
                return [...prev, compressedBase64]
              }
              return prev
            })
          }
          processedCount++
          if (processedCount === fileList.length) {
            setCompressing(false)
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleParticipantToggle = (id: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleAssignmentChange = (userId: string, task: string) => {
    setAssignments(prev => prev.map(a => a.user_id === userId ? { ...a, task } : a))
  }

  const handleNext = () => {
    setErrorMsg('')
    if (currentStep === 1) {
      if (!meetingDate) {
        setErrorMsg('Vui lòng chọn ngày họp.')
        return
      }
      if (!meetingTime) {
        setErrorMsg('Vui lòng chọn giờ họp.')
        return
      }
      if (selectedParticipants.length < 2) {
        setErrorMsg('Ghi chép họp nhóm yêu cầu tối thiểu phải có 2 thành viên tham dự.')
        return
      }
    } else if (currentStep === 2) {
      if (!content.trim()) {
        setErrorMsg('Vui lòng điền nội dung trao đổi & kết quả họp.')
        return
      }
      if (!difficulties.trim()) {
        setErrorMsg('Vui lòng điền các khó khăn/vấn đề gặp phải.')
        return
      }
      if (!solutions.trim()) {
        setErrorMsg('Vui lòng điền giải pháp đề xuất.')
        return
      }
    }

    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setErrorMsg('')
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!user) return
    setErrorMsg('')
    setSuccessMsg('')

    // Validate assignments
    const hasEmptyAssignment = assignments.some(a => !a.task.trim())
    if (hasEmptyAssignment) {
      setErrorMsg('Vui lòng điền phân công nhiệm vụ cho tất cả các thành viên tham gia.')
      return
    }

    setSubmitting(true)

    const payload = {
      meeting_date: meetingDate,
      meeting_time: meetingTime + (meetingTime.length === 5 ? ':00' : ''),
      duration_minutes: Number(duration),
      participants: selectedParticipants,
      content: content.trim(),
      difficulties: difficulties.trim(),
      solutions: solutions.trim(),
      assignments: assignments.map(a => ({ user_id: a.user_id, task: a.task.trim() })),
      attachments: attachments,
      created_by: user.id
    }

    try {
      if (editId) {
        const { error } = await supabase
          .from('group_meetings')
          .update(payload)
          .eq('id', editId)
        if (error) throw error
        setSuccessMsg('Đã cập nhật ghi chép họp nhóm thành công!')
      } else {
        const { error } = await supabase
          .from('group_meetings')
          .insert([payload])
        if (error) throw error
        setSuccessMsg('Đã đăng ghi chép họp nhóm thành công!')
      }

      // Auto-fill individual reports for non-admin participants
      const nonAdminParticipants = selectedParticipants.filter(pId => {
        const prof = profiles.find(p => p.id === pId)
        return prof && prof.role !== 'admin'
      })

      let targetReportDate = meetingDate
      const d = new Date(meetingDate + 'T00:00:00')
      if (d.getDay() === 0) { // Sunday
        d.setDate(d.getDate() + 1)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const date = String(d.getDate()).padStart(2, '0')
        targetReportDate = `${year}-${month}-${date}`
      }

      for (const pId of nonAdminParticipants) {
        // Find assignment for this participant
        const assignment = assignments.find(a => a.user_id === pId)
        const userTask = assignment ? assignment.task.trim() : ''
        
        // Define fields for the report
        const reportTodayTasks = `[Báo cáo nhóm] Tham gia họp nhóm định kỳ.\n- Nội dung họp: ${content.trim()}`
        const reportNextDayPlan = userTask || 'Theo phân công của họp nhóm định kỳ.'
        const reportProblems = `Khó khăn từ họp nhóm: ${difficulties.trim()}`
        const reportLessons = `Giải pháp đề xuất: ${solutions.trim()}`

        // Check if report already exists for this user on this date
        const { data: existingReport, error: fetchError } = await supabase
          .from('reports')
          .select('id, today_tasks')
          .eq('user_id', pId)
          .eq('report_date', targetReportDate)
          .maybeSingle()

        if (fetchError) {
          console.error(`Error checking existing report for user ${pId}:`, fetchError)
          continue
        }

        const reportPayload = {
          user_id: pId,
          report_date: targetReportDate,
          today_tasks: reportTodayTasks,
          lessons_learned: reportLessons,
          problems_and_solutions: reportProblems,
          next_day_plan: reportNextDayPlan,
          attachments: attachments, // share group meeting attachments
          updated_at: new Date().toISOString()
        }

        if (existingReport) {
          // Only overwrite if it was auto-filled from a group meeting to avoid overwriting user's manual edits
          if (existingReport.today_tasks?.startsWith('[Báo cáo nhóm]')) {
            const { error: updateError } = await supabase
              .from('reports')
              .update(reportPayload)
              .eq('id', existingReport.id)
            if (updateError) {
              console.error(`Error updating report for user ${pId}:`, updateError)
            }
          }
        } else {
          // Insert a new report
          const { error: insertError } = await supabase
            .from('reports')
            .insert([reportPayload])
          if (insertError) {
            console.error(`Error inserting report for user ${pId}:`, insertError)
          }
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })

      setTimeout(() => {
        router.push('/report/group')
      }, 1500)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Lỗi khi lưu ghi chép họp nhóm.')
      setSubmitting(false)
    }
  }

  const getProfileName = (userId: string) => {
    const prof = profiles.find(p => p.id === userId)
    return prof?.full_name || 'Thành viên'
  }

  const steps = [
    { title: 'Thông tin chung', desc: 'Thời gian, thời lượng và thành viên tham gia', icon: Calendar },
    { title: 'Nội dung chi tiết', desc: 'Vấn đề trao đổi, khó khăn và giải pháp', icon: BookOpen },
    { title: 'Phân công nhiệm vụ', desc: 'Mô tả đầu việc cụ thể cho từng thành viên', icon: ClipboardList }
  ]

  if (loading || !user || fetchingProfiles) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    )
  }

  const ActiveIcon = steps[currentStep - 1].icon

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
            <Link href="/report/group" className="text-slate-400 hover:text-white transition-colors cursor-pointer mr-2">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{editId ? 'Chỉnh sửa Ghi chép Họp Nhóm' : 'Tạo Ghi chép Họp Nhóm mới'}</h1>
              <p className="text-slate-400 text-sm mt-0.5">Ghi chép họp nhóm sẽ được hiển thị công khai trên bảng tin chung.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Progress Tracker */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Bước {currentStep} trên {steps.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">{steps[currentStep - 1].title}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Form Card */}
            <div className="glass-card p-8 rounded-2xl shadow-xl min-h-[400px] flex flex-col justify-between">
              <div className="space-y-6">
                {/* Active Step Indicator */}
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                  <div className="h-9 w-9 bg-violet-600/10 text-violet-400 rounded-lg flex items-center justify-center border border-violet-500/20">
                    <ActiveIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-white">{steps[currentStep - 1].title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{steps[currentStep - 1].desc}</p>
                  </div>
                </div>

                {/* Status messages */}
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                {/* STEP 1: General Info */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Ngày họp</label>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="glass-input block w-full rounded-xl py-2 px-3 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Giờ họp bắt đầu</label>
                        <input
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="glass-input block w-full rounded-xl py-2 px-3 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Thời lượng (phút)</label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="glass-input block w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none cursor-pointer"
                        >
                          <option value={30}>30 phút</option>
                          <option value={45}>45 phút</option>
                          <option value={60}>60 phút</option>
                          <option value={90}>90 phút</option>
                          <option value={120}>120 phút</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Thành viên tham dự (Chọn checklist)</label>
                      <p className="text-[10px] text-slate-500">Hãy chọn đầy đủ những người thực tế tham gia họp ngày hôm nay.</p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
                        {profiles.map(p => {
                          const isSelected = selectedParticipants.includes(p.id)
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleParticipantToggle(p.id)}
                              className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition-all cursor-pointer text-left focus:outline-none ${isSelected
                                ? 'bg-violet-600/10 border-violet-500/40 text-white'
                                : 'bg-slate-900/30 border-white/5 text-slate-400 hover:border-white/10'
                                }`}
                            >
                              <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-violet-600 border-violet-500 text-white' : 'border-white/20'
                                }`}>
                                {isSelected && <span className="text-[10px] font-bold">✓</span>}
                              </div>
                              <UserAvatar
                                avatarUrl={p.avatar_url}
                                fullName={p.full_name || p.email}
                                sizeClass="h-5 w-5 text-[9px]"
                              />
                              <span className="text-xs truncate font-semibold">{p.full_name || p.email}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Content Details */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-violet-400" /> 1. Nội dung trao đổi & kết quả buổi họp <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Ví dụ:&#13;• Thống nhất chia việc phần Laravel và WordPress.&#13;• Trao đổi về lỗi setup SSL cho Cloudflare.&#13;• Bàn bạc thiết kế UX của Dashboard."
                        rows={4}
                        className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> 2. Khó khăn / Vấn đề phát sinh <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={difficulties}
                        onChange={(e) => setDifficulties(e.target.value)}
                        placeholder="Ví dụ:&#13;• Lỗi certbot SSL không lấy được chứng chỉ trên server aaPanel.&#13;• Tràn RAM EC2 khi build container."
                        rows={4}
                        className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <Lightbulb className="h-3.5 w-3.5 text-emerald-400" /> 3. Giải pháp đề xuất <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={solutions}
                        onChange={(e) => setSolutions(e.target.value)}
                        placeholder="Ví dụ:&#13;• Tắt WAF Cloudflare tạm thời để verification file được thông suốt.&#13;• Tạo phân vùng RAM ảo (Swap memory) dung lượng 2GB trên VPS."
                        rows={4}
                        className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none"
                      />
                    </div>

                    {/* Image upload section (attachments) */}
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <Image className="h-3.5 w-3.5 text-violet-400" /> Ảnh minh chứng cuộc họp (Tối đa 5 ảnh)
                      </label>
                      <p className="text-[10px] text-slate-500">Đính kèm các ảnh chụp màn hình cuộc họp Zoom, Discord, Google Meet...</p>

                      <div className="flex flex-wrap gap-3 pt-2">
                        {attachments.map((img, idx) => (
                          <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden border border-white/10 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`Minh chứng ${idx + 1}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full p-1 transition-colors cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}

                        {attachments.length < 5 && (
                          <label className="h-20 w-20 rounded-xl border border-dashed border-white/20 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all flex flex-col items-center justify-center cursor-pointer gap-1 text-slate-500 hover:text-slate-300">
                            {compressing ? (
                              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                            ) : (
                              <>
                                <Image className="h-5 w-5" />
                                <span className="text-[9px] font-bold uppercase">Tải ảnh</span>
                              </>
                            )}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={compressing}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Assignments */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5 text-violet-400" /> 4. Phân công nhiệm vụ cụ thể <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-[10px] text-slate-500">Mô tả chi tiết công việc được giao cho từng thành viên đã chọn ở bước 1.</p>
                    </div>

                    <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                      {assignments.map(a => (
                        <div key={a.user_id} className="bg-slate-900/30 border border-white/5 rounded-xl p-4 space-y-2">
                          <div className="text-xs font-bold text-violet-300 flex items-center gap-2">
                            <Users className="h-4 w-4 text-violet-400" />
                            Phân công cho: <span className="text-white font-extrabold">{getProfileName(a.user_id)}</span>
                          </div>
                          <input
                            type="text"
                            value={a.task}
                            onChange={(e) => handleAssignmentChange(a.user_id, e.target.value)}
                            placeholder={`Ví dụ: Hoàn thiện API đăng nhập Laravel / Sửa lỗi CSS Safari...`}
                            className="glass-input block w-full rounded-xl py-2 px-3 text-sm focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step actions */}
              <div className="flex justify-between items-center border-t border-white/5 pt-6 mt-8">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1 || submitting}
                  className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Quay lại
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 shadow-md shadow-violet-600/10 cursor-pointer"
                  >
                    Tiếp tục <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-violet-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Đang nộp...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> {editId ? 'Cập nhật ghi chép' : 'Đăng ghi chép'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

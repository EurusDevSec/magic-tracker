'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Save,
  BookOpen,
  HelpCircle,
  Calendar,
  ListTodo,
  AlertTriangle,
  Loader2,
  Clock,
  Image,
  X
} from 'lucide-react'

const DRAFT_KEY = 'eti-report-draft'

export default function ReportForm() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)

  // Form states
  const [todayTasks, setTodayTasks] = useState('')
  const [lessonsLearned, setLessonsLearned] = useState('')
  const [problemsAndSolutions, setProblemsAndSolutions] = useState('')
  const [nextDayPlan, setNextDayPlan] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [compressing, setCompressing] = useState(false)

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

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingReportId, setExistingReportId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isPastDeadline, setIsPastDeadline] = useState(false)

  useEffect(() => {
    const now = new Date()
    if (now.getHours() >= 17) {
      setIsPastDeadline(true)
    }
  }, [])

  // 1. Fetch today's report on mount to check if user already submitted
  useEffect(() => {
    if (!user) return

    const fetchTodayReport = async () => {
      try {
        const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .eq('report_date', todayStr)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setExistingReportId(data.id)
          setTodayTasks(data.today_tasks)
          setLessonsLearned(data.lessons_learned || '')
          setProblemsAndSolutions(data.problems_and_solutions || '')
          setNextDayPlan(data.next_day_plan)
          setAttachments(data.attachments || [])
        } else {
          // If no existing report, load draft from localStorage
          const savedDraft = localStorage.getItem(DRAFT_KEY)
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft)
              setTodayTasks(parsed.todayTasks || '')
              setLessonsLearned(parsed.lessonsLearned || '')
              setProblemsAndSolutions(parsed.problemsAndSolutions || '')
              setNextDayPlan(parsed.nextDayPlan || '')
              setAttachments(parsed.attachments || [])
            } catch (e) {
              console.error('Error parsing draft', e)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching today\'s report:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayReport()
  }, [user, supabase])

  // 2. Save draft to localStorage on change (only if it's a new report)
  useEffect(() => {
    if (existingReportId || loading) return

    const draft = {
      todayTasks,
      lessonsLearned,
      problemsAndSolutions,
      nextDayPlan,
      attachments
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [todayTasks, lessonsLearned, problemsAndSolutions, nextDayPlan, attachments, existingReportId, loading])

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!user) return

    // Simple Validation
    if (!todayTasks.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng điền nội dung "Hôm nay làm gì"' })
      setCurrentStep(1)
      return
    }
    if (!nextDayPlan.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng điền nội dung "Kế hoạch ngày mai"' })
      setCurrentStep(4)
      return
    }

    setSubmitting(true)
    setMessage(null)

    const todayStr = new Date().toLocaleDateString('en-CA')

    const reportPayload = {
      user_id: user.id,
      report_date: todayStr,
      today_tasks: todayTasks,
      lessons_learned: lessonsLearned || null,
      problems_and_solutions: problemsAndSolutions || null,
      next_day_plan: nextDayPlan,
      attachments: attachments,
      updated_at: new Date().toISOString()
    }

    try {
      if (existingReportId) {
        // Update existing report
        const { error } = await supabase
          .from('reports')
          .update(reportPayload)
          .eq('id', existingReportId)

        if (error) throw error
        setMessage({ type: 'success', text: 'Cập nhật báo cáo thành công!' })
      } else {
        // Insert new report
        const { error } = await supabase
          .from('reports')
          .insert([reportPayload])

        if (error) throw error

        // Clear draft on success
        localStorage.removeItem(DRAFT_KEY)
        setExistingReportId('temp-submitted') // Mark as submitted so draft doesn't write anymore
        setMessage({ type: 'success', text: 'Nộp báo cáo thành công!' })
      }

      // Scroll to top & redirect to history shortly
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => {
        router.push('/report/history')
      }, 1500)

    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu báo cáo' })
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    { title: 'Hôm nay làm gì?', desc: 'Nhiệm vụ và kết quả công việc hôm nay', icon: ListTodo },
    { title: 'Học được gì?', desc: 'Kiến thức, bài học mới đúc kết được', icon: BookOpen },
    { title: 'Vấn đề & Giải pháp', desc: 'Khó khăn gặp phải và cách bạn đã vượt qua', icon: HelpCircle },
    { title: 'Kế hoạch ngày mai', desc: 'Mục tiêu trọng tâm cho ngày tiếp theo', icon: Calendar },
    { title: 'Xác nhận & Nộp', desc: 'Kiểm tra lại toàn bộ thông tin báo cáo', icon: CheckCircle2 }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  const ActiveStepIcon = steps[currentStep - 1].icon

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">

      {/* Existing Report Warning banner */}
      {existingReportId && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Bạn đã nộp báo cáo hôm nay.</span> Việc nộp lại form này sẽ ghi đè báo cáo cũ của ngày hôm nay ({new Date().toLocaleDateString('vi-VN')}).
          </div>
        </div>
      )}

      {/* Deadline Warning banner */}
      {!existingReportId && isPastDeadline && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300 flex items-start gap-3">
          <Clock className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <span className="font-bold text-rose-400">Đã quá hạn nộp hằng ngày (17h00)!</span> Báo cáo của bạn sẽ được đánh dấu là <span className="font-bold text-rose-400 underline">Nộp muộn</span>. Vui lòng hoàn thành và nộp sớm nhất có thể.
          </div>
        </div>
      )}

      {!existingReportId && !isPastDeadline && (
        <div className="rounded-xl bg-violet-500/10 border border-violet-500/25 p-4 text-sm text-violet-300 flex items-start gap-3">
          <Clock className="h-5 w-5 shrink-0 mt-0.5 text-violet-400" />
          <div>
            <span className="font-bold text-violet-400">Hạn nộp hằng ngày:</span> Trước <span className="font-bold text-white">17h00</span>. Hãy hoàn thành báo cáo đúng hạn để đảm bảo ghi nhận chuyên cần nhé!
          </div>
        </div>
      )}

      {/* Progress Bar Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Bước {currentStep} trên {steps.length}
          </span>
          <span className="text-xs text-slate-400">
            {existingReportId ? 'Chế độ: Chỉnh sửa' : 'Tự động lưu nháp'}
          </span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
          <div
            className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Indicator Bullets */}
        <div className="flex justify-between mt-4">
          {steps.map((s, idx) => {
            const stepNum = idx + 1
            const isCompleted = stepNum < currentStep
            const isActive = stepNum === currentStep

            return (
              <button
                key={idx}
                onClick={() => stepNum <= (existingReportId ? 5 : currentStep) && setCurrentStep(stepNum)}
                disabled={!existingReportId && stepNum > currentStep}
                className={`flex flex-col items-center gap-1 group focus:outline-none ${!existingReportId && stepNum > currentStep ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border ${isCompleted
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : isActive
                    ? 'bg-violet-500/20 border-violet-500 text-violet-400 ring-2 ring-violet-500/30'
                    : 'bg-slate-900 border-white/10 text-slate-400 group-hover:border-slate-500'
                  }`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
                </div>
                <span className={`text-[10px] hidden md:block font-medium ${isActive ? 'text-violet-400 font-bold' : 'text-slate-500'}`}>
                  {s.title.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main step container */}
      <div className="glass-card p-8 rounded-2xl shadow-xl min-h-[350px] flex flex-col justify-between">
        <div>
          {/* Header of Active Step */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
            <div className="h-10 w-10 bg-violet-600/10 text-violet-400 rounded-lg flex items-center justify-center border border-violet-500/20">
              <ActiveStepIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{steps[currentStep - 1].title}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{steps[currentStep - 1].desc}</p>
            </div>
          </div>

          {/* Submission status messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl border text-sm ${message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
              {message.text}
            </div>
          )}

          {/* Step Fields */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Hôm nay bạn đã làm được những gì? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={todayTasks}
                  onChange={(e) => setTodayTasks(e.target.value)}
                  placeholder="Ví dụ:&#13;• Thiết kế database schema và các API routes.&#13;• Viết tài liệu API cho frontend.&#13;• Sửa lỗi hiển thị UI trên các thiết bị di động."
                  rows={8}
                  className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none"
                />
                <p className="text-xs text-slate-500">Nên viết dưới dạng gạch đầu dòng rõ ràng để dễ theo dõi.</p>
              </div>

              {/* Upload screenshots */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-semibold text-slate-300">
                  Ảnh minh chứng kết quả (Chụp màn hình - Tối đa 5 ảnh):
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {attachments.map((base64, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={base64}
                        alt={`Attachment ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center border border-rose-500 shadow-md transition-all scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-[9px] text-center text-slate-300 font-bold opacity-60">
                        Ảnh {index + 1}
                      </div>
                    </div>
                  ))}

                  {attachments.length < 5 && (
                    <label className="relative aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-violet-500/50 bg-slate-900/50 hover:bg-violet-950/10 flex flex-col items-center justify-center gap-1.5 text-center p-3 transition-all cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={compressing}
                      />
                      {compressing ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                          <span className="text-[10px] text-slate-500 font-bold">Đang nén...</span>
                        </>
                      ) : (
                        <>
                          <Image className="h-6 w-6 text-slate-400 group-hover:text-violet-400 transition-colors" />
                          <span className="text-[10px] text-slate-400 group-hover:text-violet-300 font-bold transition-colors">Tải ảnh lên</span>
                          <span className="text-[9px] text-slate-500">Còn lại: {5 - attachments.length}</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Bạn đã tích lũy hay học được kiến thức gì mới? (Không bắt buộc)
              </label>
              <textarea
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="Ví dụ:&#13;• Hiểu sâu hơn về Row Level Security (RLS) của Supabase.&#13;• Cách sử dụng Next.js Server Components tối ưu SEO.&#13;• Kỹ năng quản lý thời gian Pomodoro."
                rows={8}
                className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none"
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Gặp vấn đề/khó khăn nào & Cách bạn giải quyết ra sao? (Không bắt buộc)
              </label>
              <textarea
                value={problemsAndSolutions}
                onChange={(e) => setProblemsAndSolutions(e.target.value)}
                placeholder="Ví dụ:&#13;• Gặp lỗi CORS khi tích hợp API -> Cách giải quyết: Cấu hình lại next.config.js rewrite rule.&#13;• Bị trễ tiến độ do Docker bị crash -> Đã cài lại và kéo backup từ repo về."
                rows={8}
                className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none"
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Kế hoạch và công việc trọng tâm cho ngày mai là gì? <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={nextDayPlan}
                onChange={(e) => setNextDayPlan(e.target.value)}
                placeholder="Ví dụ:&#13;• Kết nối frontend với API Supabase.&#13;• Viết test case cho tính năng Đăng nhập.&#13;• Review code cùng nhóm trưởng."
                rows={8}
                className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none"
              />
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <p className="text-sm text-slate-300">Vui lòng rà soát lại thông tin trước khi nộp báo cáo:</p>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 border border-white/5 p-4 rounded-xl bg-slate-950/40">
                <div>
                  <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">1. Hôm nay làm gì</h4>
                  <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">{todayTasks || <span className="text-rose-400 italic">Trống</span>}</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">2. Học được gì</h4>
                  <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">{lessonsLearned || <span className="text-slate-500 italic">Trống</span>}</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">3. Vấn đề & Giải pháp</h4>
                  <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">{problemsAndSolutions || <span className="text-slate-500 italic">Trống</span>}</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">4. Ngày mai làm gì</h4>
                  <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">{nextDayPlan || <span className="text-rose-400 italic">Trống</span>}</p>
                </div>
                {attachments.length > 0 && (
                  <div className="border-t border-white/5 pt-3">
                    <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">5. Ảnh minh chứng ({attachments.length} ảnh)</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {attachments.map((base64, idx) => (
                        <div key={idx} className="h-16 w-24 rounded-lg overflow-hidden border border-white/10 shadow-sm shrink-0 bg-slate-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={base64}
                            alt={`Preview ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form Action Buttons */}
        <div className="flex justify-between items-center border-t border-white/5 pt-6 mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
            className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Quay lại
          </button>

          {currentStep < 5 ? (
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
                  <Save className="h-4 w-4" /> Nộp báo cáo
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

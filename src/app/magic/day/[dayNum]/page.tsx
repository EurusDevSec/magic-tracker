'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { MAGIC_DAYS } from '@/lib/magic-days'
import { 
  Sparkles, 
  ArrowLeft, 
  Save, 
  Heart, 
  Loader2, 
  HelpCircle, 
  BookOpen,
  Compass,
  Smile
} from 'lucide-react'
import Link from 'next/link'

type GratitudeItem = {
  id: number
  thing: string
  reason: string
}

export default function MagicDayDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const supabase = createClient()
  
  const dayNum = parseInt(params.dayNum as string)
  const dayConfig = MAGIC_DAYS.find(d => d.day === dayNum)

  // Form States
  const [items, setItems] = useState<GratitudeItem[]>(
    Array.from({ length: 10 }, (_, i) => ({ id: i + 1, thing: '', reason: '' }))
  )
  const [magicStone, setMagicStone] = useState('')
  const [extraValues, setExtraValues] = useState<Record<string, string>>({})

  // Status States
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const DRAFT_KEY = `eurus-magic-draft-day-${dayNum}`

  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch access rights & initial data
  useEffect(() => {
    if (!user || !dayConfig) return

    const checkAccessAndLoad = async () => {
      try {
        // 1. Fetch user's completed days
        const { data: logs, error: logErr } = await supabase
          .from('gratitude_logs')
          .select('day_number, gratitude_list, magic_stone_thought, day_specific_practice')
          .eq('user_id', user.id)

        if (logErr) throw logErr

        const completedDays = logs?.map(l => l.day_number) || []
        
        // Lock rules: must complete all prior days
        // (e.g. to do Day 3, they must have completed Day 1 and 2, which means length >= 2)
        const isCompleted = completedDays.includes(dayNum)
        const maxAvailableDay = completedDays.length + 1
        
        if (dayNum > maxAvailableDay && !isCompleted) {
          // Attempting to access a locked day
          router.push('/magic')
          return
        }

        // 2. Load existing data if they've completed it
        const existingLog = logs?.find(l => l.day_number === dayNum)
        if (existingLog) {
          setIsEditMode(true)
          if (existingLog.gratitude_list && Array.isArray(existingLog.gratitude_list)) {
            // Map saved json list to items state
            const savedItems = existingLog.gratitude_list as GratitudeItem[]
            const loaded = Array.from({ length: 10 }, (_, i) => {
              const match = savedItems.find(item => item.id === i + 1)
              return match ? match : { id: i + 1, thing: '', reason: '' }
            })
            setItems(loaded)
          }
          setMagicStone(existingLog.magic_stone_thought || '')
          setExtraValues(existingLog.day_specific_practice || {})
        } else {
          // Load from Local Storage Draft
          const draft = localStorage.getItem(DRAFT_KEY)
          if (draft) {
            try {
              const parsed = JSON.parse(draft)
              if (parsed.items) setItems(parsed.items)
              if (parsed.magicStone) setMagicStone(parsed.magicStone)
              if (parsed.extraValues) setExtraValues(parsed.extraValues)
            } catch (e) {
              console.error('Error loading draft', e)
            }
          }
        }
      } catch (err) {
        console.error('Access check error:', err)
      } finally {
        setCheckingAccess(false)
      }
    }

    checkAccessAndLoad()
  }, [user, dayNum, dayConfig, supabase, router, DRAFT_KEY])

  // Save Draft to localStorage on input change
  useEffect(() => {
    if (checkingAccess || isEditMode || !dayConfig) return

    const draft = {
      items,
      magicStone,
      extraValues
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [items, magicStone, extraValues, checkingAccess, isEditMode, DRAFT_KEY, dayConfig])

  // Handle Input Changes
  const handleItemChange = (id: number, field: 'thing' | 'reason', val: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item))
  }

  const handleExtraChange = (key: string, val: string) => {
    setExtraValues(prev => ({ ...prev, [key]: val }))
  }

  // Count filled gratitude items
  const filledCount = items.filter(item => item.thing.trim() !== '' && item.reason.trim() !== '').length

  // Submit Logic
  const handleSubmit = async () => {
    if (!user || !dayConfig) return

    // Validate gratitude entries (must be exactly 10!)
    const invalidItems = items.some(item => !item.thing.trim() || !item.reason.trim())
    if (invalidItems) {
      setMessage({ type: 'error', text: 'Hãy điền đầy đủ cả 10 điều biết ơn (Lòng biết ơn & Lý do) để hoàn thành bài tập.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Validate Magic Stone (needed for Day 2+ to capture daily reflection)
    if (dayNum >= 2 && !magicStone.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng hoàn thành bài tập Hòn Đá Nhiệm Màu ở phía cuối.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const todayStr = new Date().toLocaleDateString('en-CA')

    const logPayload = {
      user_id: user.id,
      day_number: dayNum,
      log_date: todayStr,
      gratitude_list: items,
      magic_stone_thought: magicStone.trim() || null,
      day_specific_practice: extraValues
    }

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('gratitude_logs')
          .update(logPayload)
          .eq('user_id', user.id)
          .eq('day_number', dayNum)

        if (error) throw error
        setMessage({ type: 'success', text: `Cập nhật Ngày ${dayNum} thành công!` })
      } else {
        const { error } = await supabase
          .from('gratitude_logs')
          .insert([logPayload])

        if (error) throw error
        
        // Remove draft
        localStorage.removeItem(DRAFT_KEY)
        setMessage({ type: 'success', text: `Chúc mừng bạn đã hoàn thành Ngày ${dayNum}!` })
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => {
        router.push('/magic')
      }, 1500)

    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu bài thực hành' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || checkingAccess) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!dayConfig) {
    return (
      <div className="p-8 text-center bg-slate-950 min-h-screen text-slate-400">
        Không tìm thấy thông tin cho Ngày này.
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl relative">
        {/* Glow Blobs */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Back Link */}
        <Link 
          href="/magic" 
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại Bản đồ Phép màu
        </Link>

        {/* Header Block */}
        <div className="glass-card p-6 md:p-8 border-amber-500/20 bg-amber-950/10 rounded-2xl mb-8">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                Ngày {dayNum} / 28
              </div>
              <h1 className="text-3xl font-extrabold text-white text-gold-gradient">{dayConfig.title}</h1>
              <p className="text-xs text-amber-300/80 italic font-medium mt-0.5">{dayConfig.subtitle}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Heart className="h-6 w-6 fill-amber-500/20" />
            </div>
          </div>

          <div className="mt-6 border-t border-amber-500/10 pt-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <BookOpen className="h-4 w-4 text-amber-400" /> Hướng dẫn bài tập:
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {dayConfig.instruction}
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl border text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-8">
          
          {/* Section 1: 10 Gratitude List Items */}
          <div className="glass-card p-6 md:p-8 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Smile className="h-5 w-5 text-amber-400" /> 10 Điều Biết Ơn Của Bạn
                </h3>
                <p className="text-xs text-slate-400 mt-1">Cấu trúc: &quot;Tôi thực sự biết ơn [Ai/Cái gì] bởi vì [Lý do]...&quot;</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border self-start ${
                filledCount === 10 
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                Đã điền: {filledCount} / 10 điều
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  {/* Thing */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Điều {item.id}: Tôi thật sự biết ơn...
                    </label>
                    <input
                      type="text"
                      value={item.thing}
                      onChange={(e) => handleItemChange(item.id, 'thing', e.target.value)}
                      placeholder="ví dụ: cha mẹ của tôi, công việc hiện tại, sức khỏe của tôi..."
                      className="glass-input block w-full rounded-lg px-3.5 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-0 glass-input-gold"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Bởi vì...
                    </label>
                    <input
                      type="text"
                      value={item.reason}
                      onChange={(e) => handleItemChange(item.id, 'reason', e.target.value)}
                      placeholder="ví dụ: vì họ luôn ủng hộ tôi vô điều kiện, vì giúp tôi có thu nhập..."
                      className="glass-input block w-full rounded-lg px-3.5 py-2 text-sm placeholder-slate-600 focus:outline-none focus:ring-0 glass-input-gold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Day specific practice inputs (if configured) */}
          {dayConfig.extraInputs && dayConfig.extraInputs.length > 0 && (
            <div className="glass-card p-6 md:p-8 rounded-2xl space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <Compass className="h-5 w-5 text-amber-400" /> Bài tập bổ sung Ngày {dayNum}
              </h3>
              
              <div className="space-y-4">
                {dayConfig.extraInputs.map((input) => (
                  <div key={input.key} className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-300">
                      {input.label}
                    </label>
                    {input.type === 'textarea' ? (
                      <textarea
                        value={extraValues[input.key] || ''}
                        onChange={(e) => handleExtraChange(input.key, e.target.value)}
                        placeholder={input.placeholder}
                        rows={6}
                        className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none glass-input-gold"
                      />
                    ) : (
                      <input
                        type="text"
                        value={extraValues[input.key] || ''}
                        onChange={(e) => handleExtraChange(input.key, e.target.value)}
                        placeholder={input.placeholder}
                        className="glass-input block w-full rounded-lg p-3 text-sm focus:outline-none glass-input-gold"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Magic Stone Evening Practice (For all days except day 1, or rather, standard in the book from Day 2 onwards) */}
          {dayNum >= 2 && (
            <div className="glass-card p-6 md:p-8 rounded-2xl space-y-6 border border-amber-500/10 bg-amber-950/5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" /> Bài tập tối: Hòn Đá Nhiệm Màu
                </h3>
                <p className="text-xs text-slate-400 mt-1">Nghĩ về cả ngày hôm nay, tìm ra điều tốt đẹp nhất xảy ra với bạn và cảm ơn.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Điều tốt đẹp nhất xảy ra với bạn hôm nay là gì? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={magicStone}
                  onChange={(e) => setMagicStone(e.target.value)}
                  placeholder="Ví dụ:&#13;• Hôm nay tôi hoàn thành xuất sắc buổi thuyết trình sản phẩm mới và nhận được lời khen từ giám đốc.&#13;• Chiều nay gia đình cùng nhau quây quần ăn bữa tối vui vẻ ấm áp.&#13;• Gặp lại người bạn thân đã lâu không liên lạc..."
                  rows={4}
                  className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none glass-input-gold"
                />
              </div>
            </div>
          )}

          {/* Submit Trigger */}
          <div className="flex justify-between items-center pt-4">
            <Link
              href="/magic"
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Hủy bỏ & quay lại
            </Link>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm px-6 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> {isEditMode ? 'Cập nhật bài tập' : 'Hoàn thành Ngày'}
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  Smile,
  AlertTriangle
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
  const { user, profile, loading } = useAuth()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const searchParams = useSearchParams()
  const queryUserId = searchParams ? searchParams.get('userId') : null
  const isViewingOthers = !!(queryUserId && queryUserId !== user?.id && profile?.role === 'admin')
  const targetUserId = isViewingOthers ? queryUserId : user?.id
  const [targetProfileName, setTargetProfileName] = useState('')
  
  const dayNum = parseInt(params.dayNum as string)
  const dayConfig = MAGIC_DAYS.find(d => d.day === dayNum)

  // Fetch target profile name if viewing others
  useEffect(() => {
    if (isViewingOthers && queryUserId) {
      const fetchTargetProfile = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', queryUserId)
            .single()
          if (data) {
            setTargetProfileName(data.full_name || 'Thành viên')
          }
        } catch (err) {
          console.error(err)
        }
      }
      fetchTargetProfile()
    }
  }, [isViewingOthers, queryUserId])

  // Form States
  const [items, setItems] = useState<GratitudeItem[]>(
    Array.from({ length: 10 }, (_, i) => ({ id: i + 1, thing: '', reason: '' }))
  )
  const [magicStone, setMagicStone] = useState('')
  const [extraValues, setExtraValues] = useState<Record<string, string>>({})
  const [isQuickMode, setIsQuickMode] = useState(false) // Default to Notebook Mode (Điền khuyết)
  const [quickText, setQuickText] = useState('')

  const getInitialText = (gratitudeItems: GratitudeItem[]) => {
    const isEmpty = gratitudeItems.every(item => !item.thing && !item.reason)
    if (isEmpty) {
      return Array.from({ length: 10 }, (_, i) => `${i + 1}. Tôi thực sự biết ơn ... vì ...`).join('\n')
    }
    return gratitudeItems.map((item, idx) => {
      if (!item.thing && !item.reason) return `${idx + 1}. `
      return `${idx + 1}. Tôi thực sự biết ơn ${item.thing || ''} vì ${item.reason || ''}`
    }).join('\n')
  }

  const parseAndSetQuickText = (text: string) => {
    setQuickText(text)
    const lines = text.split('\n')
    const parsedItems = Array.from({ length: 10 }, (_, i) => {
      const line = lines[i] || ''
      let cleanLine = line.replace(/^\d+[\.\/\-]?\s*/, '').trim()
      let thing = cleanLine
      let reason = ''
      
      const splitKeywords = [' bởi vì ', ' vì ', ' do ', ' - ', ' : ', ' – ']
      for (const kw of splitKeywords) {
        const idx = cleanLine.toLowerCase().indexOf(kw)
        if (idx !== -1) {
          thing = cleanLine.substring(0, idx).trim()
          thing = thing.replace(/^tôi\s+thực\s+sự\s+biết\s+ơn\s+/i, '').replace(/^tôi\s+biết\s+ơn\s+/i, '').replace(/^biết\s+ơn\s+/i, '').trim()
          reason = cleanLine.substring(idx + kw.length).trim()
          break
        }
      }
      
      if (!reason && thing) {
        thing = thing.replace(/^tôi\s+thực\s+sự\s+biết\s+ơn\s+/i, '').replace(/^tôi\s+biết\s+ơn\s+/i, '').replace(/^biết\s+ơn\s+/i, '').trim()
      }
      
      if (thing === '...' || thing === '___') thing = ''
      if (reason === '...' || reason === '___') reason = ''
      
      return {
        id: i + 1,
        thing,
        reason
      }
    })
    setItems(parsedItems)
  }

  // Status States
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const DRAFT_KEY = `eti-magic-draft-day-${dayNum}`

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
        const targetId = isViewingOthers ? queryUserId : user.id
        // 1. Fetch target user's completed days
        const { data: logs, error: logErr } = await supabase
          .from('gratitude_logs')
          .select('day_number, gratitude_list, magic_stone_thought, day_specific_practice')
          .eq('user_id', targetId)

        if (logErr) throw logErr

        const completedDays = logs?.map((l: { day_number: number }) => l.day_number) || []
        
        // Lock rules: must complete all prior days
        const isCompleted = completedDays.includes(dayNum)
        const maxAvailableDay = completedDays.length + 1
        
        // Only redirect if NOT viewing as admin
        if (!isViewingOthers && dayNum > maxAvailableDay && !isCompleted) {
          // Attempting to access a locked day
          router.push('/magic')
          return
        }

        // 2. Load existing data if they've completed it
        const existingLog = logs?.find((l: { day_number: number }) => l.day_number === dayNum)
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
            setQuickText(getInitialText(loaded))
          }
          setMagicStone(existingLog.magic_stone_thought || '')
          setExtraValues(existingLog.day_specific_practice || {})
        } else {
          // Load from Local Storage Draft
          const draft = localStorage.getItem(DRAFT_KEY)
          if (draft) {
            try {
              const parsed = JSON.parse(draft)
              if (parsed.items) {
                setItems(parsed.items)
                setQuickText(getInitialText(parsed.items))
              }
              if (parsed.magicStone) setMagicStone(parsed.magicStone)
              if (parsed.extraValues) setExtraValues(parsed.extraValues)
              if (parsed.isQuickMode !== undefined) setIsQuickMode(parsed.isQuickMode)
            } catch (e) {
              console.error('Error loading draft', e)
            }
          } else {
            setQuickText(getInitialText(items))
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
    if (checkingAccess || isEditMode || isViewingOthers || !dayConfig) return

    const draft = {
      items,
      magicStone,
      extraValues,
      isQuickMode
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [items, magicStone, extraValues, isQuickMode, checkingAccess, isEditMode, DRAFT_KEY, dayConfig])

  // Handle Input Changes
  const handleItemChange = (id: number, field: 'thing' | 'reason', val: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item))
  }

  const handleExtraChange = (key: string, val: string) => {
    setExtraValues(prev => ({ ...prev, [key]: val }))
  }

  // Count filled gratitude items
  const filledCount = items.filter(item => item.thing.trim() !== '').length

  // Submit Logic
  const handleSubmit = async () => {
    if (!user || !dayConfig || isViewingOthers) return

    // Validate gratitude entries (must be exactly 10!)
    const hasEmptyThing = items.some(item => !item.thing.trim())
    if (hasEmptyThing) {
      setMessage({ type: 'error', text: 'Hãy điền đầy đủ cả 10 điều biết ơn để hoàn thành bài tập.' })
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

      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full relative">
        <div className="max-w-5xl mx-auto w-full">
        {/* Glow Blobs */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Back Link */}
        <Link 
          href="/magic" 
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại Bản đồ Phép màu
        </Link>

        {isViewingOthers && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
            <span>Bạn đang xem nhật ký biết ơn của <strong>{targetProfileName}</strong>. Chế độ chỉ đọc (Read-only).</span>
          </div>
        )}

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Smile className="h-5 w-5 text-amber-400" /> {isViewingOthers ? `10 Điều Biết Ơn Của ${targetProfileName}` : '10 Điều Biết Ơn Của Bạn'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isQuickMode 
                    ? "Mỗi điều viết trên 1 dòng. Dùng mẫu: 'Tôi thực sự biết ơn [điều] vì [lý do]'" 
                    : "Điền vào chỗ trống bên dưới để hoàn thành 10 điều biết ơn."}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {!isViewingOthers && (
                  <button
                    type="button"
                    onClick={() => setIsQuickMode(!isQuickMode)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all cursor-pointer"
                  >
                    {isQuickMode ? "📋 Chuyển sang Sổ tay" : "📝 Chuyển sang Nhập nhanh"}
                  </button>
                )}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  filledCount === 10 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  Đã điền: {filledCount} / 10 điều
                </span>
              </div>
            </div>

            {/* Inputs Container */}
            {isQuickMode ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-amber-300 bg-amber-950/20 border border-amber-500/10 p-3.5 rounded-xl">
                  <span>💡 <b>Mẹo nhập nhanh:</b> Bạn có thể viết tự do hoặc chỉnh sửa mẫu dưới đây. Ghi rõ <b>điều biết ơn</b> và <b>lý do (từ khóa &quot;vì&quot; hoặc &quot;bởi vì&quot;)</b> trên từng dòng để hệ thống tự động bóc tách.</span>
                </div>
                <textarea
                  value={quickText}
                  onChange={(e) => parseAndSetQuickText(e.target.value)}
                  placeholder="1. Tôi thực sự biết ơn ... vì ...&#13;2. Tôi thực sự biết ơn ... vì ..."
                  rows={11}
                  className="glass-input block w-full rounded-xl p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-0 glass-input-gold whitespace-pre-wrap animate-fadeIn"
                />

                {/* Live Preview for Quick Mode */}
                <div className="mt-6 border-t border-white/5 pt-4">
                  <h4 className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Bản dịch trực quan (Live Preview)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item) => (
                      <div key={item.id} className="bg-slate-900/40 border border-white/5 rounded-xl p-3.5 flex gap-2.5 items-start">
                        <span className="text-xs font-black text-amber-500/70 mt-0.5">{item.id.toString().padStart(2, '0')}.</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">
                            {item.thing ? `Tôi thực sự biết ơn: ${item.thing}` : <span className="text-slate-600 italic font-normal">(Trống)</span>}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                            {item.reason ? `vì: ${item.reason}` : <span className="text-slate-600 italic font-normal">(Chưa điền lý do)</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="bg-slate-950/40 border border-amber-500/15 rounded-2xl p-4 md:p-6 space-y-4 relative shadow-inner overflow-hidden"
                style={{ 
                  backgroundImage: 'radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.03), transparent 70%)'
                }}
              >
                {/* Warning notice if some reasons are empty */}
                {items.some(item => item.thing.trim() && !item.reason.trim()) && (
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all">
                    <span>💡 <b>Gợi ý:</b> Hãy điền thêm &quot;Lý do&quot; (bởi vì...) để lòng biết ơn của bạn phát huy hiệu quả tốt nhất nhé! (Tuy nhiên, bạn vẫn có thể hoàn thành bài tập).</span>
                  </div>
                )}

                <div className="space-y-3 relative z-10">
                  {items.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 py-3 border-b border-white/[0.02] last:border-0 hover:bg-amber-500/[0.01] px-2 rounded-lg transition-colors group"
                    >
                      {/* Number and static starter */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-amber-500 tracking-tight min-w-[20px] select-none font-serif">
                          {item.id.toString().padStart(2, '0')}.
                        </span>
                        <span className="text-xs font-semibold text-slate-400 group-focus-within:text-amber-400 transition-colors">
                          Tôi thực sự biết ơn
                        </span>
                      </div>

                      {/* Thing input */}
                      <div className="flex-1 min-w-0">
                        <input
                          id={`thing-input-${idx}`}
                          type="text"
                          disabled={isViewingOthers}
                          value={item.thing}
                          onChange={(e) => handleItemChange(item.id, 'thing', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              document.getElementById(`reason-input-${idx}`)?.focus()
                            }
                          }}
                          placeholder="cha mẹ của tôi, sức khỏe, một người bạn..."
                          className="w-full bg-transparent border-0 border-b border-white/10 group-focus-within:border-amber-500/30 focus:border-amber-500 focus:outline-none px-1 pb-1 text-sm text-white placeholder-slate-600 transition-all font-medium focus:ring-0 focus:shadow-none"
                        />
                      </div>

                      {/* Split word 'vì' */}
                      <span className="text-xs font-semibold text-slate-500 shrink-0 px-1 select-none">
                        vì
                      </span>

                      {/* Reason input */}
                      <div className="flex-1.5 min-w-0">
                        <input
                          id={`reason-input-${idx}`}
                          type="text"
                          disabled={isViewingOthers}
                          value={item.reason}
                          onChange={(e) => handleItemChange(item.id, 'reason', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (idx < 9) {
                                document.getElementById(`thing-input-${idx + 1}`)?.focus()
                              }
                            }
                          }}
                          placeholder="họ luôn chăm sóc tôi, giúp tôi học hỏi..."
                          className="w-full bg-transparent border-0 border-b border-white/10 group-focus-within:border-amber-500/30 focus:border-amber-500 focus:outline-none px-1 pb-1 text-sm text-white placeholder-slate-600 transition-all font-medium focus:ring-0 focus:shadow-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                        disabled={isViewingOthers}
                        rows={6}
                        className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none glass-input-gold"
                      />
                    ) : (
                      <input
                        type="text"
                        value={extraValues[input.key] || ''}
                        onChange={(e) => handleExtraChange(input.key, e.target.value)}
                        placeholder={input.placeholder}
                        disabled={isViewingOthers}
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
                  disabled={isViewingOthers}
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
              {isViewingOthers ? 'Quay lại bản đồ' : 'Hủy bỏ & quay lại'}
            </Link>

            {!isViewingOthers && (
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
            )}
          </div>

        </div>
        </div>
      </main>
    </div>
  )
}

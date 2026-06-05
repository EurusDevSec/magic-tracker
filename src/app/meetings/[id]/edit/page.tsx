'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { ChevronLeft, Save, Loader2, Plus, X, Upload, Info } from 'lucide-react'

const AVAILABLE_TAGS = [
  'Nội lực', 'Triết lý', 'Tam Bảo', 'Tự phát triển',
  'Giao tiếp', 'Thấu cảm', 'Định vị nghề nghiệp', 'Tủ sách',
  'Kỹ năng', 'Tư duy', 'Phật giáo', 'Sức khỏe tinh thần'
]
const TAG_COLORS: Record<string, string> = {
  'Nội lực':       'bg-violet-500/20 text-violet-300 border-violet-500/40',
  'Triết lý':      'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'Tam Bảo':       'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Tự phát triển': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'Giao tiếp':     'bg-sky-500/20 text-sky-300 border-sky-500/40',
  'Thấu cảm':      'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  'Định vị nghề nghiệp': 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  'Tủ sách':       'bg-orange-500/20 text-orange-300 border-orange-500/40',
}
const MAX_IMAGES = 5; const MAX_IMG_DIM = 800; const IMG_QUALITY = 0.7

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > MAX_IMG_DIM || height > MAX_IMG_DIM) {
          if (width > height) { height = Math.round(height * MAX_IMG_DIM / width); width = MAX_IMG_DIM }
          else { width = Math.round(width * MAX_IMG_DIM / height); height = MAX_IMG_DIM }
        }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', IMG_QUALITY))
      }
      img.onerror = reject; img.src = e.target?.result as string
    }
    reader.onerror = reject; reader.readAsDataURL(file)
  })
}

export default function EditMeetingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fetching, setFetching] = useState(true)
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('09:00')
  const [summary, setSummary] = useState('')
  const [decisions, setDecisions] = useState('')
  const [challenges, setChallenges] = useState<string[]>([''])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [attachments, setAttachments] = useState<string[]>([])
  const [compressing, setCompressing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading, router])

  useEffect(() => {
    if (!user || !id) return
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from('boss_meetings').select('*').eq('id', id).single()
        if (error) throw error
        setTitle(data.title)
        setMeetingDate(data.meeting_date)
        setMeetingTime(data.meeting_time.slice(0, 5))
        setSummary(data.summary)
        setDecisions(data.decisions || '')
        setChallenges(data.challenges?.length ? data.challenges : [''])
        setSelectedTags(data.tags || [])
        setAttachments(data.attachments || [])
      } catch (err) {
        setErrorMsg('Không thể tải dữ liệu buổi họp.')
      } finally {
        setFetching(false)
      }
    }
    fetchData()
  }, [user, id, supabase])

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  const addChallenge = () => setChallenges(prev => [...prev, ''])
  const removeChallenge = (i: number) => setChallenges(prev => prev.filter((_, idx) => idx !== i))
  const updateChallenge = (i: number, val: string) => setChallenges(prev => prev.map((c, idx) => idx === i ? val : c))

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return
    const remaining = MAX_IMAGES - attachments.length
    if (remaining <= 0) return
    setCompressing(true)
    try {
      const compressed = await Promise.all(Array.from(files).slice(0, remaining).map(compressImage))
      setAttachments(prev => [...prev, ...compressed])
    } catch { setErrorMsg('Lỗi xử lý ảnh.') } finally { setCompressing(false) }
  }

  const handleSubmit = async () => {
    if (!user) return
    setErrorMsg('')
    if (!title.trim()) { setErrorMsg('Vui lòng nhập tiêu đề.'); return }
    if (!summary.trim()) { setErrorMsg('Vui lòng nhập tóm tắt.'); return }
    setSubmitting(true)
    const cleanChallenges = challenges.map(c => c.trim()).filter(Boolean)
    try {
      const { error } = await supabase.from('boss_meetings').update({
        title: title.trim(),
        meeting_date: meetingDate,
        meeting_time: meetingTime + ':00',
        summary: summary.trim(),
        decisions: decisions.trim() || null,
        challenges: cleanChallenges.length > 0 ? cleanChallenges : null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        attachments,
      }).eq('id', id)
      if (error) throw error
      router.push(`/meetings/${id}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật.')
      setSubmitting(false)
    }
  }

  if (loading || !user || fetching) {
    return <div className="flex h-screen w-screen items-center justify-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-violet-500" /></div>
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto w-full space-y-6">

          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Link href={`/meetings/${id}`} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Chỉnh Sửa Buổi Họp</h1>
              <p className="text-slate-400 text-sm mt-0.5">Ai cũng có thể đóng góp chỉnh sửa nội dung buổi họp</p>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/20 text-violet-300 text-xs">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Nội dung buổi họp được mọi thành viên cùng đóng góp và chỉnh sửa để đảm bảo thông tin đầy đủ và chính xác nhất.</span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm font-semibold">{errorMsg}</div>
          )}

          <div className="space-y-5">
            {/* Basic info */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">Thông tin cơ bản</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tiêu đề <span className="text-rose-400">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="glass-input block w-full rounded-xl py-2.5 px-4 text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ngày họp</label>
                  <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)}
                    className="glass-input block w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Giờ</label>
                  <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)}
                    className="glass-input block w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">Chủ đề</h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${isSelected ? (TAG_COLORS[tag] || 'bg-violet-500/20 text-violet-300 border-violet-500/40') : 'bg-slate-900/30 text-slate-400 border-white/10 hover:border-white/20'}`}>
                      {isSelected && '✓ '}{tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">Tóm tắt <span className="text-rose-400">*</span></h3>
              <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={5}
                className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none resize-none" />
            </div>

            {/* Decisions */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Lời khuyên từ Mentor</h3>
                <span className="text-xs text-slate-500">(Markdown)</span>
              </div>
              <textarea value={decisions} onChange={e => setDecisions(e.target.value)} rows={6}
                className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none resize-none font-mono" />
            </div>

            {/* Challenges */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">Thử thách được đề cập</h3>
              <div className="space-y-2">
                {challenges.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={c} onChange={e => updateChallenge(i, e.target.value)}
                      placeholder={`Thử thách ${i + 1}...`}
                      className="glass-input flex-1 rounded-xl py-2 px-3 text-sm focus:outline-none" />
                    {challenges.length > 1 && (
                      <button type="button" onClick={() => removeChallenge(i)}
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addChallenge}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Thêm thử thách
              </button>
            </div>

            {/* Images */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">Ảnh đính kèm</h3>
                <span className="text-xs text-slate-500">{attachments.length}/{MAX_IMAGES}</span>
              </div>
              {attachments.length < MAX_IMAGES && (
                <div onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 group">
                  {compressing
                    ? <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                    : <Upload className="h-5 w-5 text-slate-500 group-hover:text-violet-400 transition-colors" />}
                  <p className="text-xs text-slate-400">{compressing ? 'Đang nén ảnh...' : 'Click để thêm ảnh'}</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handleImageUpload(e.target.files)} />
                </div>
              )}
              {attachments.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {attachments.map((img, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                      <img src={img} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 pb-8">
              <Link href={`/meetings/${id}`}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                Huỷ
              </Link>
              <button type="button" onClick={handleSubmit} disabled={submitting || compressing}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20 disabled:opacity-50 cursor-pointer">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

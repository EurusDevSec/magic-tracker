'use client'

import React from 'react'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import {
  ChevronLeft, Calendar, Clock, Sparkles, Edit3,
  Loader2, X, Tag, ListChecks
} from 'lucide-react'

type BossMeeting = {
  id: string
  title: string
  meeting_date: string
  meeting_time: string
  summary: string
  decisions: string | null
  challenges: string[] | null
  tags: string[] | null
  attachments: string[] | null
  created_by: string | null
  created_at: string
}

type Profile = { id: string; full_name: string; email: string }

const TAG_COLORS: Record<string, string> = {
  'Nội lực':       'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Triết lý':      'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Tam Bảo':       'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Tự phát triển': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Giao tiếp':     'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Thấu cảm':      'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Định vị nghề nghiệp': 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'Tủ sách':       'bg-orange-500/15 text-orange-300 border-orange-500/30',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// Minimal markdown renderer (bold, italic, blockquote, headings, bullets)
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactElement[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('> ')) {
      // Blockquote
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <blockquote key={i} className="border-l-3 border-amber-400 pl-4 py-1 my-3 bg-amber-500/5 rounded-r-lg">
          {quoteLines.map((ql, qi) => (
            <p key={qi} className="text-amber-200 italic text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineMarkdown(ql) }} />
          ))}
        </blockquote>
      )
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-bold text-white mt-5 mb-2">{line.slice(4)}</h3>)
      i++
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-extrabold text-white mt-6 mb-2">{line.slice(3)}</h2>)
      i++
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={i} className="space-y-1 my-2 ml-2">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-violet-400 mt-1 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }} />
            </li>
          ))}
        </ul>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
      i++
    } else {
      elements.push(
        <p key={i} className="text-sm text-slate-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />
      )
      i++
    }
  }
  return elements
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-200 italic">$1</em>')
    .replace(/_(.+?)_/g, '<em class="text-slate-200 italic">$1</em>')
}

export default function MeetingDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const supabase = createClient()

  const [meeting, setMeeting] = useState<BossMeeting | null>(null)
  const [creator, setCreator] = useState<Profile | null>(null)
  const [fetching, setFetching] = useState(true)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user || !id) return
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('boss_meetings').select('*').eq('id', id).single()
        if (error) throw error
        setMeeting(data)
        if (data.created_by) {
          const { data: p } = await supabase.from('profiles').select('id, full_name, email').eq('id', data.created_by).single()
          setCreator(p)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetch()
  }, [user, id, supabase])

  if (loading || !user || fetching) {
    return <div className="flex h-screen w-screen items-center justify-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-violet-500" /></div>
  }

  if (!meeting) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
        <Navigation />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-400 mb-4">Không tìm thấy buổi họp này.</p>
            <Link href="/meetings" className="text-violet-400 hover:text-violet-300 text-sm font-semibold">← Quay lại danh sách</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <button className="absolute top-4 right-4 text-white hover:text-slate-300 cursor-pointer">
            <X className="h-8 w-8" />
          </button>
          <img
            src={lightboxImg}
            alt="Ảnh chi tiết"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto w-full space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Link href="/meetings" className="text-slate-400 hover:text-white transition-colors cursor-pointer mt-1">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">{meeting.title}</h1>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(meeting.meeting_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {meeting.meeting_time.slice(0, 5)}
                  </span>
                  {creator && <span className="text-slate-500">Ghi nhận bởi {creator.full_name}</span>}
                </div>
              </div>
            </div>
            <Link
              href={`/meetings/${id}/edit`}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-white hover:bg-violet-600 border border-violet-500/30 hover:border-violet-500 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" /> Chỉnh sửa
            </Link>
          </div>

          {/* Tags */}
          {meeting.tags && meeting.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Tag className="h-3.5 w-3.5 text-slate-500" />
              {meeting.tags.map(tag => (
                <span key={tag} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TAG_COLORS[tag] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="glass-card rounded-2xl p-6 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tóm tắt nội dung</h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{meeting.summary}</p>
          </div>

          {/* Decisions */}
          {meeting.decisions && (
            <div className="glass-card rounded-2xl p-6 border-amber-500/15">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Lời Khuyên Vàng Từ Mentor
              </h2>
              <div className="space-y-1">
                {renderMarkdown(meeting.decisions)}
              </div>
            </div>
          )}

          {/* Challenges */}
          {meeting.challenges && meeting.challenges.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-4 flex items-center gap-2">
                <ListChecks className="h-3.5 w-3.5" /> Thử Thách Được Đề Cập
              </h2>
              <ul className="space-y-2.5">
                {meeting.challenges.map((ch, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-slate-300">
                    <span className="shrink-0 h-5 w-5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {ch}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Image Gallery */}
          {meeting.attachments && meeting.attachments.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Ảnh Đính Kèm ({meeting.attachments.length})
              </h2>
              <div className={`grid gap-3 ${meeting.attachments.length === 1 ? 'grid-cols-1' : meeting.attachments.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {meeting.attachments.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-violet-500/50 transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => setLightboxImg(img)}
                  >
                    <img src={img} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pb-8">
            <p className="text-xs text-slate-600">
              Ghi nhận lúc {new Date(meeting.created_at).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import React from 'react'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import {
  Sparkles, Brain, MessageCircle, Briefcase, BookMarked,
  Plus, X, Save, Loader2, ChevronRight
} from 'lucide-react'

type Lesson = {
  id: string
  title: string
  content: string
  category: 'Mindset' | 'Communication' | 'Career' | 'Resources'
  meeting_id: string | null
  created_by: string | null
  created_at: string
}

const CATEGORIES = [
  { key: 'all',           label: 'Tất cả',                icon: Sparkles,       color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  { key: 'Mindset',       label: 'Triết lý & Nội lực',    icon: Brain,          color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { key: 'Communication', label: 'Giao tiếp & Thấu cảm',  icon: MessageCircle,  color: 'text-sky-400',    bg: 'bg-sky-500/10',    border: 'border-sky-500/30' },
  { key: 'Career',        label: 'Định vị sự nghiệp',     icon: Briefcase,      color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/30' },
  { key: 'Resources',     label: 'Sách & Tài nguyên',     icon: BookMarked,     color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
]

function getCategoryMeta(key: string) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0]
}

// Minimal markdown renderer
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactElement[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) { quoteLines.push(lines[i].slice(2)); i++ }
      elements.push(
        <blockquote key={i} className="border-l-4 border-amber-400 pl-4 py-1 my-3 bg-amber-500/5 rounded-r-lg">
          {quoteLines.map((ql, qi) => <p key={qi} className="text-amber-200 italic text-sm" dangerouslySetInnerHTML={{ __html: inline(ql) }} />)}
        </blockquote>
      )
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-bold text-white mt-4 mb-2">{line.slice(4)}</h3>); i++
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-extrabold text-white mt-5 mb-2">{line.slice(3)}</h2>); i++
    } else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\. /.test(line)) {
      const items: string[] = []
      const isNum = /^\d+\. /.test(line)
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* ') || /^\d+\. /.test(lines[i]))) {
        items.push(lines[i].replace(/^(-|\*|\d+\.)\s/, '')); i++
      }
      elements.push(
        <ul key={i} className="space-y-1.5 my-2 ml-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className={`shrink-0 mt-0.5 ${isNum ? 'text-violet-400 font-bold text-xs' : 'text-violet-400'}`}>{isNum ? `${ii + 1}.` : '•'}</span>
              <span dangerouslySetInnerHTML={{ __html: inline(item) }} />
            </li>
          ))}
        </ul>
      )
    } else if (line.startsWith('| ')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        if (!lines[i].includes('---')) rows.push(lines[i].split('|').filter(Boolean).map(c => c.trim()))
        i++
      }
      if (rows.length > 0) elements.push(
        <div key={i} className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>{rows[0].map((h, hi) => <th key={hi} className="border border-white/10 px-3 py-2 text-left text-slate-300 font-bold bg-slate-900/50" dangerouslySetInnerHTML={{ __html: inline(h) }} />)}</tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-900/20' : ''}>
                  {row.map((cell, ci) => <td key={ci} className="border border-white/10 px-3 py-2 text-slate-300" dangerouslySetInnerHTML={{ __html: inline(cell) }} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />); i++
    } else {
      elements.push(<p key={i} className="text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(line) }} />); i++
    }
  }
  return elements
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-slate-200">$1</em>')
    .replace(/_(.+?)_/g, '<em class="italic text-slate-200">$1</em>')
}

export default function LessonsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null)
  const [showForm, setShowForm] = useState(false)

  // New lesson form
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState<'Mindset' | 'Communication' | 'Career' | 'Resources'>('Mindset')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('boss_lessons').select('*').order('created_at', { ascending: false })
        if (error) throw error
        setLessons(data || [])
      } catch { } finally { setFetching(false) }
    }
    fetch()
  }, [user, supabase])

  const filtered = activeTab === 'all' ? lessons : lessons.filter(l => l.category === activeTab)

  const handleSaveLesson = async () => {
    if (!user) return
    setFormError('')
    if (!newTitle.trim()) { setFormError('Vui lòng nhập tiêu đề.'); return }
    if (!newContent.trim()) { setFormError('Vui lòng nhập nội dung.'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('boss_lessons').insert([{
        title: newTitle.trim(), content: newContent.trim(),
        category: newCategory, meeting_id: null, created_by: user.id
      }])
      if (error) throw error
      const inserted = (data as any)?.[0]
      if (inserted) setLessons(prev => [inserted, ...prev])
      setNewTitle(''); setNewContent(''); setNewCategory('Mindset'); setShowForm(false)
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu bài học.')
    } finally { setSaving(false) }
  }

  if (loading || !user) {
    return <div className="flex h-screen w-screen items-center justify-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-violet-500" /></div>
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      {/* Lesson Modal */}
      {openLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpenLesson(null)}>
          <div className="glass-panel rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                {(() => {
                  const meta = getCategoryMeta(openLesson.category)
                  const Icon = meta.icon
                  return <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}><Icon className="h-3 w-3" />{meta.label}</span>
                })()}
              </div>
              <button onClick={() => setOpenLesson(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-2">
              <h2 className="text-xl font-extrabold text-white leading-tight mb-4">{openLesson.title}</h2>
              {renderMarkdown(openLesson.content)}
              <p className="text-xs text-slate-600 pt-4 border-t border-white/5 mt-6">
                Thêm vào {new Date(openLesson.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto w-full space-y-7">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Tư Duy & Hành Động</h1>
                <p className="text-sm text-slate-400 mt-0.5">Thư viện tư duy và bài học từ Mentor Anh Phụng</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Thêm bài học
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div className="glass-card rounded-2xl p-6 space-y-4 border-violet-500/20">
              <h3 className="text-sm font-bold text-white">Thêm bài học mới</h3>
              {formError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">{formError}</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tiêu đề <span className="text-rose-400">*</span></label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="VD: Kỹ thuật lắng nghe sâu..."
                  className="glass-input block w-full rounded-xl py-2.5 px-4 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Danh mục</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)}
                  className="glass-input block w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none cursor-pointer">
                  <option value="Mindset">Triết lý & Nội lực</option>
                  <option value="Communication">Giao tiếp & Thấu cảm</option>
                  <option value="Career">Định vị sự nghiệp</option>
                  <option value="Resources">Sách & Tài nguyên</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nội dung <span className="text-rose-400">*</span> <span className="text-slate-500">(hỗ trợ Markdown)</span></label>
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={8} placeholder="## Tiêu đề&#10;&#10;Nội dung bài học...&#10;&#10;> Quote từ sếp"
                  className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none resize-none font-mono" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer">Huỷ</button>
                <button onClick={handleSaveLesson} disabled={saving}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? 'Đang lưu...' : 'Lưu bài học'}
                </button>
              </div>
            </div>
          )}

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              const isActive = activeTab === cat.key
              return (
                <button key={cat.key} onClick={() => setActiveTab(cat.key)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${isActive ? `${cat.bg} ${cat.color} ${cat.border}` : 'bg-slate-900/30 text-slate-400 border-white/10 hover:border-white/20'}`}>
                  <Icon className="h-3.5 w-3.5" /> {cat.label}
                </button>
              )
            })}
          </div>

          {/* Lessons grid */}
          {fetching ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-14 flex flex-col items-center justify-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-violet-400 opacity-50" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Chưa có bài học nào</h2>
                <p className="text-slate-400 text-sm">Thêm bài học đầu tiên từ buổi họp với sếp.</p>
              </div>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer">
                <Plus className="h-4 w-4" /> Thêm bài học
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(lesson => {
                const meta = getCategoryMeta(lesson.category)
                const Icon = meta.icon
                const preview = lesson.content.replace(/#+\s/g, '').replace(/>\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').slice(0, 120) + '...'
                return (
                  <div key={lesson.id}
                    onClick={() => setOpenLesson(lesson)}
                    className="glass-card rounded-2xl p-5 cursor-pointer hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-600/10 group transition-all duration-300 flex flex-col gap-3">
                    <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border self-start ${meta.bg} ${meta.color} ${meta.border}`}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug group-hover:text-violet-300 transition-colors">{lesson.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed flex-1">{preview}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-600">{new Date(lesson.created_at).toLocaleDateString('vi-VN')}</span>
                      <span className="flex items-center gap-0.5 text-xs text-violet-400 font-semibold group-hover:gap-1.5 transition-all">
                        Đọc <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

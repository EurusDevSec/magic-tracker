'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import {
  Sparkles, Brain, MessageCircle, Briefcase, BookMarked,
  Plus, X, Save, Loader2, Link2, Trash2, Edit3, Search,
  Eye, Grid, Maximize2, Move, HelpCircle, AlertCircle,
  FileText, Upload, Image as ImageIcon, Zap
} from 'lucide-react'

type Lesson = {
  id: string
  title: string
  content: string
  category: 'Mindset' | 'Communication' | 'Career' | 'Resources' | 'Meeting'
  meeting_id: string | null
  created_by: string | null
  created_at: string
  x_pos: number
  y_pos: number
  connections: string[]
  width: number
  height: number
  image_url: string | null
}

const CATEGORIES = [
  { key: 'Mindset',       label: 'Triết lý & Nội lực',    icon: Brain,          color: 'text-purple-400',  border: 'border-purple-500/30',  bg: 'bg-purple-500/10',  accent: 'bg-purple-500',  glow: 'rgba(168, 85, 247, 0.15)' },
  { key: 'Communication', label: 'Giao tiếp & Thấu cảm',  icon: MessageCircle,  color: 'text-sky-400',     border: 'border-sky-500/30',     bg: 'bg-sky-500/10',     accent: 'bg-sky-500',     glow: 'rgba(14, 165, 233, 0.15)' },
  { key: 'Career',        label: 'Định vị sự nghiệp',     icon: Briefcase,      color: 'text-teal-400',    border: 'border-teal-500/30',    bg: 'bg-teal-500/10',    accent: 'bg-teal-500',    glow: 'rgba(20, 184, 166, 0.15)' },
  { key: 'Resources',     label: 'Sách & Tài nguyên',     icon: BookMarked,     color: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   accent: 'bg-amber-500',   glow: 'rgba(245, 158, 11, 0.15)' },
  { key: 'Meeting',       label: 'Cuộc họp & Review',     icon: Sparkles,       color: 'text-rose-400',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10',    accent: 'bg-rose-500',    glow: 'rgba(244, 63, 94, 0.15)' }
]

function getCategoryMeta(key: string) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0]
}

// Client-side UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Minimal markdown renderer
function renderMarkdown(text: string) {
  if (!text) return null
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

const STEPS = [
  "AI đang đọc và làm sạch văn bản...",
  "Đang phân tích cấu trúc chủ đề...",
  "Đang bóc tách các bài học & hành động cụ thể...",
  "Đang tính toán tọa độ flowchart tối ưu...",
  "Đang thiết lập liên kết đường cong giữa các thẻ...",
  "Đang đồng bộ sơ đồ lên bảng vẽ của bạn..."
]

export default function LessonsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [fetching, setFetching] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas')

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 })
  const [dragStartNode, setDragStartNode] = useState({ x: 0, y: 0 })
  const lastSavedCoords = useRef<{ [key: string]: { x: number; y: number } }>({})

  // Interactive Linking mode
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null)

  // Edit / Detail Modal state
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState<'Mindset' | 'Communication' | 'Career' | 'Resources' | 'Meeting'>('Mindset')
  const [editContent, setEditContent] = useState('')
  const [editConnections, setEditConnections] = useState<string[]>([])
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  // Create form state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createX, setCreateX] = useState(100)
  const [createY, setCreateY] = useState(100)
  const [createTitle, setCreateTitle] = useState('')
  const [createCategory, setCreateCategory] = useState<'Mindset' | 'Communication' | 'Career' | 'Resources' | 'Meeting'>('Mindset')
  const [createContent, setCreateContent] = useState('')
  const [createImageUrl, setCreateImageUrl] = useState<string | null>(null)

  // AI Import Modal State
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiInputText, setAiInputText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStep, setAiStep] = useState(0)
  const [aiError, setAiError] = useState('')

  // Layout configurations
  const cardWidth = 280
  const cardHeaderHeight = 60
  const minCardWidth = 240
  const minCardHeight = 120
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading, router])

  // Responsive switch to grid mode on small viewports
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('grid')
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // AI Stepper timer
  useEffect(() => {
    let interval: any
    if (aiLoading) {
      setAiStep(0)
      interval = setInterval(() => {
        setAiStep(prev => {
          if (prev < STEPS.length - 1) return prev + 1
          return prev
        })
      }, 2500)
    }
    return () => clearInterval(interval)
  }, [aiLoading])

  // Fetch initial notes
  const fetchLessons = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('boss_lessons').select('*')
      if (error) throw error
      const normalized: Lesson[] = (data || []).map((item: any) => ({
        ...item,
        x_pos: item.x_pos || 100,
        y_pos: item.y_pos || 100,
        connections: item.connections || [],
        width: item.width || 280,
        height: item.height || 180,
        image_url: item.image_url || null
      }))
      setLessons(normalized)
    } catch (err) {
      console.error('Lỗi khi fetch dữ liệu:', err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchLessons()
  }, [user])

  // Image upload handler (Compresses directly inside the browser using Canvas API)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 600
        let width = img.width
        let height = img.height

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width)
          width = MAX_WIDTH
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          // Compress to lightweight JPEG
          const base64 = canvas.toDataURL('image/jpeg', 0.7)
          if (isEditMode) {
            setEditImageUrl(base64)
          } else {
            setCreateImageUrl(base64)
          }
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Dragging handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, node: Lesson) => {
    if (e.button !== 0) return // Left click only
    if (linkingSourceId) return // Disable drag in linking mode

    // Check if clicked native resize handle in bottom-right corner
    const rect = e.currentTarget.getBoundingClientRect()
    const isClickingResize = (e.clientX > rect.right - 18) && (e.clientY > rect.bottom - 18)
    if (isClickingResize) {
      return // Let browser native resize work, don't drag!
    }

    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea') || target.closest('select')) {
      return
    }

    e.currentTarget.setPointerCapture(e.pointerId)
    setDraggingId(node.id)
    setDragStartMouse({ x: e.clientX, y: e.clientY })
    setDragStartNode({ x: node.x_pos, y: node.y_pos })
    lastSavedCoords.current[node.id] = { x: node.x_pos, y: node.y_pos }
    e.stopPropagation()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, node: Lesson) => {
    if (draggingId !== node.id) return

    const dx = e.clientX - dragStartMouse.x
    const dy = e.clientY - dragStartMouse.y

    const newX = Math.max(20, Math.min(2100, dragStartNode.x + dx))
    const newY = Math.max(20, Math.min(1400, dragStartNode.y + dy))

    setLessons(prev => prev.map(l => l.id === node.id ? { ...l, x_pos: newX, y_pos: newY } : l))
    e.stopPropagation()
  }

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>, node: Lesson) => {
    if (draggingId !== node.id) return

    e.currentTarget.releasePointerCapture(e.pointerId)
    setDraggingId(null)

    const lastCoords = lastSavedCoords.current[node.id]
    if (!lastCoords || lastCoords.x !== node.x_pos || lastCoords.y !== node.y_pos) {
      try {
        await supabase
          .from('boss_lessons')
          .update({ x_pos: node.x_pos, y_pos: node.y_pos })
          .eq('id', node.id)
      } catch (err) {
        console.error('Lỗi lưu toạ độ:', err)
      }
    }
  }

  // Handle native card resizing save on Mouse Up
  const handleResizeMouseUp = async (e: React.MouseEvent<HTMLDivElement>, node: Lesson) => {
    const el = e.currentTarget
    const currentW = el.clientWidth
    const currentH = el.clientHeight

    if (currentW !== node.width || currentH !== node.height) {
      setLessons(prev => prev.map(l => l.id === node.id ? { ...l, width: currentW, height: currentH } : l))
      try {
        await supabase
          .from('boss_lessons')
          .update({ width: currentW, height: currentH })
          .eq('id', node.id)
      } catch (err) {
        console.error('Lỗi lưu kích thước:', err)
      }
    }
  }

  // Handle double click canvas to spawn node
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-background')) {
      return
    }
    if (linkingSourceId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left + e.currentTarget.scrollLeft - 140)
    const y = Math.round(e.clientY - rect.top + e.currentTarget.scrollTop - 80)

    setCreateX(Math.max(20, Math.min(2100, x)))
    setCreateY(Math.max(20, Math.min(1400, y)))
    setCreateTitle('')
    setCreateCategory('Mindset')
    setCreateContent('')
    setCreateImageUrl(null)
    setShowCreateModal(true)
  }

  // Save new manually created node
  const handleCreateNode = async () => {
    if (!user) return
    setModalError('')
    if (!createTitle.trim()) { setModalError('Vui lòng nhập tiêu đề.'); return }
    if (!createContent.trim()) { setModalError('Vui lòng nhập nội dung.'); return }

    setSaving(true)
    try {
      const { data, error } = await supabase.from('boss_lessons').insert([{
        title: createTitle.trim(),
        content: createContent.trim(),
        category: createCategory,
        x_pos: createX,
        y_pos: createY,
        width: 280,
        height: 180,
        image_url: createImageUrl,
        connections: [],
        created_by: user.id
      }]).select()

      if (error) throw error

      if (data && data[0]) {
        const newNode: Lesson = {
          ...data[0],
          x_pos: data[0].x_pos || createX,
          y_pos: data[0].y_pos || createY,
          connections: data[0].connections || [],
          width: data[0].width || 280,
          height: data[0].height || 180,
          image_url: data[0].image_url || createImageUrl
        }
        setLessons(prev => [...prev, newNode])
      }
      setShowCreateModal(false)
      setCreateTitle('')
      setCreateContent('')
      setCreateImageUrl(null)
    } catch (err: any) {
      setModalError(err.message || 'Lỗi khi lưu bài học.')
    } finally {
      setSaving(false)
    }
  }

  // AI Import: analyzes raw jumbled notes and constructs structured flowchart
  const handleAiDiagramImport = async () => {
    if (!user) return
    setAiError('')
    if (!aiInputText.trim()) { setAiError('Vui lòng nhập nội dung văn bản cần AI phân tích.'); return }

    setAiLoading(true)
    try {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('Không tìm thấy GEMINI_API_KEY trong cấu hình môi trường. Vui lòng thêm GEMINI_API_KEY vào file .env.local và restart server.')
      }

      // Danh sách các model để tự động thử nghiệm (fallback) nếu một model bị quá tải (lỗi 503)
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']
      let res: Response | null = null
      let lastErrorMsg = ''

      const prompt = `Bạn là một trợ lý AI thông minh chuyên phân tích ghi chép thô, bản thu âm họp, hoặc tài liệu lộn xộn để xây dựng sơ đồ tư duy (Mindmap/Flowchart).

Nhiệm vụ của bạn:
1. Đọc kỹ đoạn văn bản ghi chép lộn xộn/thô sau đây.
2. Tổng hợp và phân loại các ý chính thành các Thẻ bài học/Cuộc họp logic.
3. Tổ chức chúng theo dạng Sơ đồ hình cây (Flowchart):
   - Tạo ra các thẻ đề mục chính (Parent Nodes) làm cột mốc chủ đề.
   - Tạo ra các thẻ bài học/hành động con (Child Nodes) chứa thông tin chi tiết.
   - Xác định toạ độ x_pos, y_pos cho từng thẻ để tạo thành sơ đồ flowchart tuyệt đẹp từ trên xuống dưới hoặc từ trái qua phải (lưu ý: mỗi thẻ rộng 280px, cao 180px, hãy tính toán sao cho các thẻ KHÔNG chồng chéo lên nhau).
     Ví dụ:
     - Thẻ gốc (Parent) ở y_pos = 100, x_pos = 150
     - Các thẻ con ở y_pos = 380, x_pos lần lượt cách nhau 320px (x_pos = 50, 370, 690...)
   - Xác định các liên kết (connections) nối từ Thẻ cha tới các Thẻ con của nó.
4. Trả về kết quả dưới dạng một mảng JSON các đối tượng.

Mỗi đối tượng trong mảng JSON bắt buộc có cấu trúc sau:
{
  "id": "chuỗi ID tự sinh độc nhất, ví dụ: node-1, node-2 để tự tham chiếu",
  "title": "Tiêu đề ngắn gọn của thẻ (dưới 50 ký tự)",
  "content": "Nội dung chi tiết ở dạng Markdown (hỗ trợ in đậm, bullet points, khối trích dẫn >). Hãy giữ lại thông tin hành động thực tế chi tiết từ văn bản.",
  "category": "Chọn một trong các giá trị: 'Mindset', 'Communication', 'Career', 'Resources', 'Meeting'.",
  "x_pos": số nguyên (toạ độ x trên canvas),
  "y_pos": số nguyên (toạ độ y trên canvas),
  "connections": [
     "mảng chứa các ID của các node mà node này kết nối tới. Thường thẻ cha sẽ chứa ID của thẻ con"
  ]
}

Hãy trả về duy nhất mảng JSON đó. Không thêm ký tự Markdown hay giải thích nào ngoài JSON.

VĂN BẢN GHI CHÉP CẦN PHÂN TÍCH:
"""
${aiInputText}
"""`

      for (const modelName of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`
        try {
          const attemptRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { 
                responseMimeType: 'application/json',
                maxOutputTokens: 8192
              }
            })
          })

          if (attemptRes.ok) {
            res = attemptRes
            break
          } else {
            const errText = await attemptRes.text()
            lastErrorMsg = `Model ${modelName} trả về lỗi ${attemptRes.status}: ${errText}`
          }
        } catch (e: any) {
          lastErrorMsg = `Model ${modelName} gặp lỗi kết nối: ${e.message}`
        }
      }

      if (!res) {
        throw new Error(`Gemini đang quá tải hoặc gặp sự cố. Vui lòng thử lại sau ít phút. Chi tiết lỗi: ${lastErrorMsg}`)
      }

      const resData = await res.json()
      const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text
      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ mô hình Gemini.')
      }

      // Robustly strip any potential markdown code block backticks
      let cleanText = responseText.trim()
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```[a-zA-Z]*\s*/, '')
        cleanText = cleanText.replace(/\s*```$/, '')
      }

      const parsedNodes = JSON.parse(cleanText.trim())
      if (!Array.isArray(parsedNodes) || parsedNodes.length === 0) {
        throw new Error('AI không tạo ra được danh sách thẻ sơ đồ tương ứng. Vui lòng kiểm tra lại văn bản.')
      }


      // Re-map temp IDs generated by AI model to clean front-end client UUIDs
      const idMap: { [key: string]: string } = {}
      parsedNodes.forEach((node: any) => {
        idMap[node.id] = generateUUID()
      })

      const finalNodes: Omit<Lesson, 'meeting_id'>[] = parsedNodes.map((node: any) => {
        return {
          id: idMap[node.id],
          title: node.title || 'Bài học AI',
          content: node.content || '',
          category: node.category || 'Mindset',
          x_pos: node.x_pos || 100,
          y_pos: node.y_pos || 100,
          width: 280,
          height: 180,
          image_url: null,
          connections: (node.connections || []).map((cId: string) => idMap[cId] || cId).filter((val: string) => val !== idMap[node.id]),
          created_by: user.id,
          created_at: new Date().toISOString()
        }
      })

      // Insert all AI-generated cards in batch
      const { data, error } = await supabase.from('boss_lessons').insert(finalNodes).select()
      if (error) throw error

      const created: Lesson[] = (data || finalNodes).map((node: any) => ({
        ...node,
        x_pos: node.x_pos || 100,
        y_pos: node.y_pos || 100,
        connections: node.connections || [],
        width: node.width || 280,
        height: node.height || 180,
        image_url: node.image_url || null
      }))

      setLessons(prev => [...prev, ...created])
      setAiInputText('')
      setShowAiModal(false)
      alert(`Đồng bộ thành công! Đã vẽ ${created.length} thẻ sơ đồ tự động lên bảng vẽ.`)
    } catch (err: any) {
      setAiError(err.message || 'Lỗi kết nối API trí tuệ nhân tạo.')
    } finally {
      setAiLoading(false)
    }
  }

  // Handle visual node click
  const handleNodeClick = (node: Lesson) => {
    if (linkingSourceId) {
      if (linkingSourceId === node.id) return // Can't link to self

      setLessons(prev => {
        return prev.map(l => {
          if (l.id === linkingSourceId) {
            const exists = l.connections.includes(node.id)
            const updatedConnections = exists
              ? l.connections.filter(id => id !== node.id)
              : [...l.connections, node.id]
            
            supabase
              .from('boss_lessons')
              .update({ connections: updatedConnections })
              .eq('id', linkingSourceId)
              .then((res: any) => {
                if (res.error) console.error("Lỗi cập nhật liên kết:", res.error)
              })

            return { ...l, connections: updatedConnections }
          }
          return l
        })
      })

      setLinkingSourceId(null)
      return
    }

    setOpenLesson(node)
    setEditTitle(node.title)
    setEditCategory(node.category)
    setEditContent(node.content)
    setEditConnections(node.connections || [])
    setEditImageUrl(node.image_url)
    setIsEditing(false)
    setModalError('')
  }

  // Save edits from modal
  const handleSaveEdits = async () => {
    if (!openLesson) return
    setModalError('')
    if (!editTitle.trim()) { setModalError('Tiêu đề không được trống.'); return }
    if (!editContent.trim()) { setModalError('Nội dung không được trống.'); return }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('boss_lessons')
        .update({
          title: editTitle.trim(),
          category: editCategory,
          content: editContent.trim(),
          connections: editConnections,
          image_url: editImageUrl
        })
        .eq('id', openLesson.id)

      if (error) throw error

      setLessons(prev => prev.map(l => l.id === openLesson.id ? {
        ...l,
        title: editTitle.trim(),
        category: editCategory,
        content: editContent.trim(),
        connections: editConnections,
        image_url: editImageUrl
      } : l))

      setOpenLesson(null)
    } catch (err: any) {
      setModalError(err.message || 'Lỗi lưu chỉnh sửa.')
    } finally {
      setSaving(false)
    }
  }

  // Delete node
  const handleDeleteNode = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá bài học/cuộc họp này không?')) return

    try {
      const { error } = await supabase.from('boss_lessons').delete().eq('id', id)
      if (error) throw error

      setLessons(prev => {
        return prev
          .filter(l => l.id !== id)
          .map(l => l.connections.includes(id) ? { ...l, connections: l.connections.filter(cId => cId !== id) } : l)
      })

      if (openLesson?.id === id) setOpenLesson(null)
    } catch (err: any) {
      alert(err.message || 'Lỗi xoá thẻ.')
    }
  }

  const isMatch = (node: Lesson) => {
    const term = searchQuery.toLowerCase().trim()
    const matchesSearch = !term || node.title.toLowerCase().includes(term) || node.content.toLowerCase().includes(term)
    const matchesCategory = selectedCategoryFilter === 'all' || node.category === selectedCategoryFilter
    return matchesSearch && matchesCategory
  }

  if (loading || !user) {
    return <div className="flex h-screen w-screen items-center justify-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-violet-500" /></div>
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      {/* --- AI DIAGRAM IMPORT MODAL --- */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => !aiLoading && setShowAiModal(false)}>
          <div className="glass-panel rounded-2xl max-w-2xl w-full shadow-2xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400 animate-pulse" />
                <h3 className="text-base font-extrabold text-white">AI Sơ đồ hóa & Phân tích ghi chép</h3>
              </div>
              {!aiLoading && <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><X className="h-5 w-5" /></button>}
            </div>
            
            <div className="p-6 space-y-4">
              {aiLoading ? (
                // AI Loading animation step
                <div className="py-12 flex flex-col items-center justify-center text-center gap-6">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                    <Sparkles className="h-6 w-6 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-violet-300 font-bold tracking-wide transition-all duration-300">{STEPS[aiStep]}</p>
                    <p className="text-xs text-slate-500">Mô hình trí tuệ nhân tạo Gemini đang thiết kế sơ đồ cây của bạn...</p>
                  </div>
                </div>
              ) : (
                // Input panel
                <>
                  {aiError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">{aiError}</div>}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Dán nội dung tài liệu thô / ghi chép lộn xộn:</p>
                    <p className="text-[10px] text-slate-500">AI sẽ tự nhận diện chủ đề, đúc kết bài học & hành động và lập sơ đồ liên kết, tính toạ độ vẽ thẻ.</p>
                  </div>
                  <textarea
                    value={aiInputText}
                    onChange={e => setAiInputText(e.target.value)}
                    rows={12}
                    placeholder="VD: Họp với sếp Phụng ngày 7/6. Sếp bảo dân code không được chỉ làm kỹ thuật thuần túy, phải biết rộng ra. Lên hành động làm bucket list 100 việc trong đời, làm visual board dán góc làm việc..."
                    className="glass-input block w-full rounded-xl p-4 text-xs focus:outline-none resize-none font-mono"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Hỗ trợ: Biên bản họp thô, nhật ký viết nhanh, file markdown lộn xộn...</span>
                    <span>Gemini-2.5-Flash Active ⚡</span>
                  </div>
                </>
              )}
            </div>

            {!aiLoading && (
              <div className="p-4 border-t border-white/5 bg-slate-900/40 flex justify-end gap-3">
                <button onClick={() => setShowAiModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer">Huỷ</button>
                <button
                  onClick={handleAiDiagramImport}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-violet-500/20 cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5" /> AI Tạo sơ đồ ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CREATE CARD MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="glass-panel rounded-2xl max-w-xl w-full shadow-2xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-900/60">
              <h3 className="text-base font-extrabold text-white">Thêm thẻ bài học / Cuộc họp</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {modalError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">{modalError}</div>}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tiêu đề *</label>
                  <input type="text" value={createTitle} onChange={e => setCreateTitle(e.target.value)} placeholder="Tiêu đề thẻ..."
                    className="glass-input block w-full rounded-xl py-2.5 px-4 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Danh mục</label>
                  <select value={createCategory} onChange={e => setCreateCategory(e.target.value as any)}
                    className="glass-input block w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none cursor-pointer">
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Banner Image URL/Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ảnh đính kèm cho thẻ <span className="text-slate-500 text-[10px]">(Tùy chọn)</span></label>
                <div className="flex gap-4 items-center">
                  <input type="text" value={createImageUrl || ''} onChange={e => setCreateImageUrl(e.target.value || null)} placeholder="Đường dẫn ảnh online (URL)..."
                    className="glass-input block flex-1 rounded-xl py-2 px-4 text-xs focus:outline-none" />
                  <label className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-xs text-slate-300 cursor-pointer shrink-0 transition-all">
                    <Upload className="h-3.5 w-3.5" /> Tải ảnh lên
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, false)} />
                  </label>
                </div>
                {createImageUrl && (
                  <div className="mt-2 relative h-16 w-28 rounded-lg overflow-hidden border border-white/10">
                    <img src={createImageUrl} alt="Preview" className="h-full w-full object-cover" />
                    <button onClick={() => setCreateImageUrl(null)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nội dung bài học / tóm tắt cuộc họp * <span className="text-slate-500 text-[10px] font-normal">(hỗ trợ Markdown)</span></label>
                <textarea value={createContent} onChange={e => setCreateContent(e.target.value)} rows={6} placeholder="Nội dung bài học..."
                  className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none resize-none font-mono" />
              </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-slate-900/40 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer">Huỷ</button>
              <button onClick={handleCreateNode} disabled={saving}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? 'Đang lưu...' : 'Lưu thẻ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DETAIL & EDIT MODAL / SLIDE DRAWER --- */}
      {openLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setOpenLesson(null)}>
          <div className="glass-panel rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-white/10 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getCategoryMeta(isEditing ? editCategory : openLesson.category).bg} ${getCategoryMeta(isEditing ? editCategory : openLesson.category).color} ${getCategoryMeta(isEditing ? editCategory : openLesson.category).border}`}>
                  {getCategoryMeta(isEditing ? editCategory : openLesson.category).label}
                </span>
                {!isEditing && <span className="text-[10px] text-slate-500">Kích thước: {openLesson.width}x{openLesson.height}px</span>}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <button onClick={() => setIsEditing(true)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer" title="Sửa nội dung">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteNode(openLesson.id)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer" title="Xoá thẻ">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button onClick={() => setOpenLesson(null)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {modalError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">{modalError}</div>}
              {isEditing ? (
                // Editing panel
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tiêu đề *</label>
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        className="glass-input block w-full rounded-xl py-2.5 px-4 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Danh mục</label>
                      <select value={editCategory} onChange={e => setEditCategory(e.target.value as any)}
                        className="glass-input block w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none cursor-pointer">
                        {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Banner Image URL/Upload (Edit) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ảnh đính kèm cho thẻ</label>
                    <div className="flex gap-4 items-center">
                      <input type="text" value={editImageUrl || ''} onChange={e => setEditImageUrl(e.target.value || null)} placeholder="Đường dẫn ảnh online (URL)..."
                        className="glass-input block flex-1 rounded-xl py-2 px-4 text-xs focus:outline-none" />
                      <label className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-xs text-slate-300 cursor-pointer shrink-0 transition-all">
                        <Upload className="h-3.5 w-3.5" /> Tải ảnh
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, true)} />
                      </label>
                    </div>
                    {editImageUrl && (
                      <div className="mt-2 relative h-16 w-28 rounded-lg overflow-hidden border border-white/10">
                        <img src={editImageUrl} alt="Preview" className="h-full w-full object-cover" />
                        <button onClick={() => setEditImageUrl(null)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nội dung * <span className="text-slate-500 text-[10px] font-normal">(hỗ trợ Markdown)</span></label>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8}
                      className="glass-input block w-full rounded-xl p-4 text-sm focus:outline-none resize-none font-mono" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Liên kết đến các thẻ khác:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-white/5 rounded-xl border border-white/5">
                      {lessons.filter(l => l.id !== openLesson.id).map(l => {
                        const checked = editConnections.includes(l.id)
                        return (
                          <label key={l.id} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                            <input type="checkbox" checked={checked}
                              onChange={() => {
                                setEditConnections(prev => checked ? prev.filter(c => c !== l.id) : [...prev, l.id])
                              }}
                              className="rounded border-white/20 text-violet-600 focus:ring-0 focus:ring-offset-0 bg-transparent h-4 w-4 cursor-pointer" />
                            <span className="truncate">{l.title}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                // Display Read view
                <div className="space-y-4">
                  {openLesson.image_url && (
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-white/10 relative">
                      <img src={openLesson.image_url} alt={openLesson.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h2 className="text-xl font-extrabold text-white leading-snug">{openLesson.title}</h2>
                  <div className="border-t border-white/5 pt-4">
                    {renderMarkdown(openLesson.content)}
                  </div>
                  {openLesson.connections && openLesson.connections.length > 0 && (
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Liên kết dòng bài học:</p>
                      <div className="flex flex-wrap gap-2">
                        {openLesson.connections.map(targetId => {
                          const target = lessons.find(l => l.id === targetId)
                          if (!target) return null
                          const meta = getCategoryMeta(target.category)
                          return (
                            <button key={targetId} onClick={() => { const t = lessons.find(l => l.id === targetId); if (t) setOpenLesson(t) }}
                              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border bg-white/5 border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white transition-all cursor-pointer`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${meta.accent}`} />
                              <span className="max-w-[200px] truncate">{target.title}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/5 bg-slate-900/60 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-500">Tạo ngày: {new Date(openLesson.created_at).toLocaleDateString('vi-VN')}</span>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer">Huỷ</button>
                    <button onClick={handleSaveEdits} disabled={saving}
                      className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-5 py-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setOpenLesson(null)} className="px-5 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all cursor-pointer">Đóng</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        
        {/* Top Control Panel */}
        <header className="p-4 md:p-6 border-b border-white/5 bg-slate-950 shrink-0 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">Bản đồ Tư duy & Bài học</h1>
                <p className="text-xs text-slate-400 mt-0.5">Nơi lưu trữ, kết nối các bài học từ Mentor và đúc kết chung của cả đội</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* AI Import trigger button */}
              <button
                onClick={() => { setAiError(''); setShowAiModal(true) }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-violet-600/15 cursor-pointer shrink-0"
              >
                <Zap className="h-3.5 w-3.5" /> AI Vẽ sơ đồ từ text thô
              </button>

              {/* Category Filter */}
              <div className="relative">
                <select value={selectedCategoryFilter} onChange={e => setSelectedCategoryFilter(e.target.value)}
                  className="glass-input appearance-none rounded-xl py-2 pl-4 pr-8 text-xs focus:outline-none cursor-pointer">
                  <option value="all">Tất cả bài học</option>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none text-slate-500 text-[10px]">▼</div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
                <button onClick={() => setViewMode('canvas')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'canvas' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                  <Maximize2 className="h-3.5 w-3.5" /> Bản đồ 2D
                </button>
                <button onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                  <Grid className="h-3.5 w-3.5" /> Dạng Lưới
                </button>
              </div>

              {/* Manual Create Button */}
              <button onClick={() => { setCreateX(200); setCreateY(200); setCreateImageUrl(null); setShowCreateModal(true) }}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0">
                <Plus className="h-3.5 w-3.5" /> Thêm thẻ
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 pt-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input type="text" placeholder="Tìm kiếm nội dung bài học..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="glass-input block w-full rounded-xl py-1.5 pl-9 pr-4 text-xs focus:outline-none" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"><X className="h-3 w-3" /></button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5 text-slate-500" /> 
                {viewMode === 'canvas' ? 'Kéo góc thẻ để co giãn. Drag tiêu đề để di chuyển. Double-click để tạo thẻ mới.' : 'Click vào thẻ để xem chi tiết.'}
              </span>
            </div>
          </div>
        </header>

        {/* --- DYNAMIC LINKING MODE NOTICE --- */}
        {linkingSourceId && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between z-40 shrink-0 text-xs text-amber-300">
            <span className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 text-amber-400 animate-pulse" />
              Chọn thẻ tiếp theo trên bảng để thiết lập / hủy liên kết từ thẻ <strong>"{lessons.find(l => l.id === linkingSourceId)?.title}"</strong>
            </span>
            <button onClick={() => setLinkingSourceId(null)}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer">
              Hủy
            </button>
          </div>
        )}

        {/* Fetching loading state */}
        {fetching ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
        ) : lessons.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-xl">💡</div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Chưa có bài học nào trên bảng</h2>
              <p className="text-slate-400 text-sm max-w-sm">Hãy tạo bài học hoặc sử dụng AI để tự tạo sơ đồ ngay từ file ghi chép của bạn.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setAiError(''); setShowAiModal(true) }}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
                <Zap className="h-4 w-4" /> AI Tạo sơ đồ từ text thô
              </button>
              <button onClick={() => { setCreateX(150); setCreateY(150); setCreateImageUrl(null); setShowCreateModal(true) }}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
                <Plus className="h-4 w-4" /> Tạo thủ công
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* --- GRID LIST VIEW MODE (Mobile Fallback) --- */
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {lessons.map(node => {
                const isNodeMatch = isMatch(node)
                const meta = getCategoryMeta(node.category)
                const Icon = meta.icon
                const preview = node.content.replace(/#+\s/g, '').replace(/>\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').slice(0, 110) + '...'

                return (
                  <div
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    style={{ opacity: isNodeMatch ? 1 : 0.25 }}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-600/10 group transition-all duration-300 flex flex-col gap-3 ${meta.border} bg-slate-900/40`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </div>
                      <span className="text-[10px] text-slate-600">{new Date(node.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {node.image_url && (
                      <div className="h-24 w-full rounded-lg overflow-hidden border border-white/10 mt-1">
                        <img src={node.image_url} alt="Banner" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <h3 className="text-sm font-extrabold text-white leading-snug group-hover:text-violet-300 transition-colors">{node.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed flex-1">{preview}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-500">Kích thước: {node.width}x{node.height}px</span>
                      <span className="flex items-center gap-0.5 text-xs text-violet-400 font-semibold group-hover:gap-1.5 transition-all">
                        Xem chi tiết <Eye className="h-3.5 w-3.5 ml-1" />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* --- 2D CANVAS VIEW MODE (Desktop dragging interface) --- */
          <div className="flex-1 overflow-auto bg-slate-950 relative" ref={canvasRef} onDoubleClick={handleCanvasDoubleClick}>
            {/* 2D Grid Canvas workspace */}
            <div className="w-[2400px] h-[1600px] absolute inset-0 canvas-background cursor-crosshair"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
                backgroundColor: '#0b0f19'
              }}
            >
              {/* Dynamic SVG Connection lines overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#818cf8" />
                  </marker>
                </defs>

                {lessons.map(node => {
                  const nodeMatch = isMatch(node)
                  const startX = node.x_pos + (node.width || 280)
                  const startY = node.y_pos + cardHeaderHeight / 2 + 10 // category header height level alignment

                  return (node.connections || []).map(targetId => {
                    const targetNode = lessons.find(l => l.id === targetId)
                    if (!targetNode) return null

                    const targetMatch = isMatch(targetNode)
                    const endX = targetNode.x_pos
                    const endY = targetNode.y_pos + cardHeaderHeight / 2 + 10

                    const dx = Math.abs(endX - startX) * 0.5
                    const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`

                    const isHighlight = nodeMatch && targetMatch
                    const strokeColor = isHighlight ? 'stroke-violet-400' : 'stroke-white/10'

                    return (
                      <g key={`${node.id}-${targetId}`} className="transition-all duration-300">
                        {isHighlight && (
                          <path d={pathD} fill="none" className="stroke-violet-500/20" strokeWidth={5} />
                        )}
                        <path
                          d={pathD}
                          fill="none"
                          className={strokeColor}
                          strokeWidth={isHighlight ? 2 : 1.5}
                          strokeDasharray={isHighlight ? '6,6' : 'none'}
                          markerEnd="url(#arrow)"
                        />
                      </g>
                    )
                  })
                })}
              </svg>

              {/* Visual Node Cards container */}
              <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {lessons.map(node => {
                  const nodeMatch = isMatch(node)
                  const meta = getCategoryMeta(node.category)
                  const Icon = meta.icon
                  const isDragging = draggingId === node.id

                  const width = node.width || 280
                  const height = node.height || 180

                  // Calculate content preview length dynamically based on size
                  const maxChar = Math.floor((width * height) / 400)
                  const previewText = node.content.replace(/#+\s/g, '').replace(/>\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').slice(0, maxChar) + '...'

                  return (
                    <div
                      key={node.id}
                      onPointerDown={e => handlePointerDown(e, node)}
                      onPointerMove={e => handlePointerMove(e, node)}
                      onPointerUp={e => handlePointerUp(e, node)}
                      onMouseUp={e => handleResizeMouseUp(e, node)}
                      className={`absolute rounded-xl pointer-events-auto shadow-lg border backdrop-blur-md overflow-hidden select-none transition-shadow duration-200 group resizable-card ${meta.border}`}
                      style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        left: `${node.x_pos}px`,
                        top: `${node.y_pos}px`,
                        transform: isDragging ? 'scale(1.025)' : 'scale(1)',
                        boxShadow: isDragging 
                          ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)' 
                          : `0 8px 30px ${nodeMatch ? meta.glow : 'rgba(0,0,0,0.3)'}`,
                        opacity: nodeMatch ? 1 : 0.25,
                        backgroundColor: 'rgba(11, 15, 25, 0.75)',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        zIndex: isDragging ? 50 : 20,
                        resize: 'both', // Native CSS Resizing enabled
                        minWidth: `${minCardWidth}px`,
                        minHeight: `${minCardHeight}px`
                      }}
                    >
                      {/* Left vertical color accent bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${meta.accent}`} />

                      {/* Header Drag Handle bar */}
                      <div className="p-3 pl-4 flex items-center justify-between border-b border-white/5 bg-slate-950/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{meta.label}</span>
                        </div>
                        {/* Actions context menu toolbar */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Linking mode trigger */}
                          <button
                            onClick={e => { e.stopPropagation(); setLinkingSourceId(node.id) }}
                            className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            title="Tạo liên kết đến thẻ khác"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </button>
                          {/* Quick Delete */}
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteNode(node.id) }}
                            className="p-0.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Xoá thẻ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Body Info */}
                      <div className="p-3 pl-4 flex flex-col justify-between cursor-pointer overflow-hidden" 
                        style={{ height: `calc(100% - ${cardHeaderHeight}px)` }}
                        onClick={() => handleNodeClick(node)}
                      >
                        <div className="space-y-1 overflow-hidden flex-1">
                          {node.image_url && (
                            <div className="h-14 w-full rounded-md overflow-hidden border border-white/5 mb-1.5 shrink-0">
                              <img src={node.image_url} alt="Banner" className="h-full w-full object-cover" />
                            </div>
                          )}
                          <h3 className="text-xs font-black text-white leading-snug truncate group-hover:text-violet-300 transition-colors">{node.title}</h3>
                          <p className="text-[9px] text-slate-400 leading-normal line-clamp-3">{previewText}</p>
                        </div>
                        
                        <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[9px] text-slate-500 mt-1 shrink-0">
                          <span>{new Date(node.created_at).toLocaleDateString('vi-VN')}</span>
                          <span className="text-violet-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">Chi tiết →</span>
                        </div>
                      </div>

                      {/* Canvas knobs for visual connections alignment */}
                      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-violet-400 border border-slate-950 animate-pulse pointer-events-none opacity-40 group-hover:opacity-100" />
                      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-violet-400 border border-slate-950 animate-pulse pointer-events-none opacity-40 group-hover:opacity-100" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Move
} from 'lucide-react'

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  initialIndex?: number
  title?: string
}

export default function ImageViewerModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title
}: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)))
      resetTransform()
    }
  }, [isOpen, initialIndex, images.length])

  // Reset scale and position when changing images
  const resetTransform = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
  }, [])

  // Zoom controls (up to 800% for 4K / deep text inspection)
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 8))
  }

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.5, 0.5)
      if (next <= 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }

  const handleSetScale = (targetScale: number) => {
    setScale(targetScale)
    if (targetScale <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  // Navigation
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      resetTransform()
    }
  }, [currentIndex, resetTransform])

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1)
      resetTransform()
    }
  }, [currentIndex, images.length, resetTransform])

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.deltaY < 0) {
      // Zoom in
      setScale(prev => Math.min(prev + 0.35, 8))
    } else {
      // Zoom out
      setScale(prev => {
        const next = Math.max(prev - 0.35, 0.5)
        if (next <= 1) setPosition({ x: 0, y: 0 })
        return next
      })
    }
  }

  // Mouse Dragging (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Double click to toggle zoom (1x <-> 3x)
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scale === 1) {
      setScale(3)
    } else {
      resetTransform()
    }
  }

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut()
      } else if (e.key === '0') {
        resetTransform()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrev, handleNext, onClose, resetTransform])

  // Open in New Tab (Full Raw Original Resolution)
  const handleOpenInNewTab = () => {
    const currentSrc = images[currentIndex]
    if (!currentSrc) return
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ảnh Gốc Độ Phân Giải Cao - ETI Tracker</title>
            <style>
              body { margin: 0; background: #07090e; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
              img { max-width: 100%; height: auto; box-shadow: 0 15px 40px rgba(0,0,0,0.8); border-radius: 8px; }
            </style>
          </head>
          <body>
            <img src="${currentSrc}" alt="Ảnh gốc chất lượng cao" />
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  // Download image
  const handleDownload = () => {
    const currentSrc = images[currentIndex]
    if (!currentSrc) return
    const a = document.createElement('a')
    a.href = currentSrc
    a.download = `minh_chung_anh_${currentIndex + 1}.webp`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl select-none animate-fadeIn"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/85 border-b border-white/10 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            🖼️ {title || 'Ảnh Minh Chứng Kết Quả (Siêu Nét 4K)'}
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/30">
            Ảnh {currentIndex + 1} / {images.length}
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-400">
            • Tỉ lệ Zoom: <strong className="text-violet-400 font-bold">{Math.round(scale * 100)}%</strong>
          </span>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenInNewTab}
            title="Mở ảnh gốc trong tab mới để xem kích thước 100%"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 hover:text-white text-xs font-semibold border border-violet-500/30 transition-all cursor-pointer shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Mở Tab Mới (100% Gốc)</span>
          </button>

          <button
            onClick={handleDownload}
            title="Tải ảnh gốc về máy"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tải về</span>
          </button>

          <button
            onClick={onClose}
            title="Đóng (Esc)"
            className="h-9 w-9 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer ml-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDoubleClick}
        className={`flex-1 relative overflow-hidden flex items-center justify-center ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
      >
        {/* Navigation Prev Button */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-slate-900/80 hover:bg-violet-600 text-white border border-white/15 hover:border-violet-500 shadow-2xl flex items-center justify-center transition-all cursor-pointer group"
          >
            <ChevronLeft className="h-6 w-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Navigation Next Button */}
        {currentIndex < images.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-slate-900/80 hover:bg-violet-600 text-white border border-white/15 hover:border-violet-500 shadow-2xl flex items-center justify-center transition-all cursor-pointer group"
          >
            <ChevronRight className="h-6 w-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Transformed Image Element with High-Performance GPU Acceleration */}
        <div
          className="transition-transform duration-75 ease-out select-none pointer-events-auto will-change-transform"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={`Ảnh minh chứng ${currentIndex + 1}`}
            draggable={false}
            className="max-w-[88vw] max-h-[76vh] object-contain rounded-lg shadow-2xl border border-white/10"
            style={{
              imageRendering: 'auto',
              WebkitBackfaceVisibility: 'hidden'
            }}
          />
        </div>
      </div>

      {/* Bottom Interactive Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-950/90 border-t border-white/10 z-20">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Move className="h-3.5 w-3.5 text-violet-400" />
          <span className="hidden md:inline">Lăn chuột để Zoom • Giữ chuột trái kéo để di chuyển • Nhấp đúp để phóng to 300%</span>
        </div>

        {/* Controls Center with Quick Presets */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/10 rounded-2xl p-1.5 shadow-xl mx-auto sm:mx-0">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            title="Thu nhỏ (-)"
            className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Quick Scale Presets */}
          {[
            { label: 'Vừa', val: 1 },
            { label: '200%', val: 2 },
            { label: '400%', val: 4 },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => handleSetScale(p.val)}
              className={`px-2.5 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                Math.round(scale) === p.val
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'bg-white/5 hover:bg-white/15 text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}

          <button
            onClick={handleZoomIn}
            disabled={scale >= 8}
            title="Phóng to (+)"
            className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            onClick={handleRotate}
            title="Xoay ảnh 90°"
            className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        {/* Thumbnail switcher if multiple images */}
        {images.length > 1 && (
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-xs py-0.5">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx)
                  resetTransform()
                }}
                className={`h-9 w-9 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  currentIndex === idx
                    ? 'border-violet-500 shadow-md shadow-violet-500/30 scale-105'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

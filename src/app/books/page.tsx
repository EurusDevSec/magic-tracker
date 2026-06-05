'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navigation from '@/components/Navigation'
import { BookOpen, Loader2, ExternalLink, X } from 'lucide-react'
import Image, { StaticImageData } from 'next/image'
import imgNguoiBanHang from './NguoiBanHangViDaiNhatTheGioiup.jpg'
import imgBuoiSang from './buoisangdieuki.jpg'
import imgBiMat from './bimatcuamayman.png'
import imgNhaGiaKim from './nhagiakim.jpg'
import imgNguoiGiau from './nguiogiauthanhbabylon.jpg'
import imgThinkGrow from './think_and_grow_rich___nghi_giau_va_lam_giau_phien_ban_dac_biet_bia_cung_1_2021_06_21_08_44_11.jpg'

type Book = {
  title: string
  titleShort: string
  author: string
  reason: string
  lesson: string
  coverImage: StaticImageData | null
  coverGradient: string
  glowColor: string
  textColor: string
  accentBg: string
  spineColor: string
  link: string
}

const BOOKS: Book[] = [
  {
    title: 'Người Bán Hàng Vĩ Đại Nhất Thế Giới',
    titleShort: 'Người Bán Hàng\nVĩ Đại Nhất',
    author: 'Og Mandino',
    reason: 'Nền tảng tư duy về thói quen và sự kiên trì bền bỉ.',
    lesson: 'Thói quen và sự kiên trì tạo nên thành công — không phải tài năng bẩm sinh. Mỗi ngày một hành động nhỏ, tích lũy thành kết quả vĩ đại.',
    coverImage: imgNguoiBanHang,
    coverGradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)',
    glowColor: 'rgba(124, 58, 237, 0.45)',
    textColor: 'text-violet-300',
    accentBg: 'bg-violet-500/10 border-violet-500/20',
    spineColor: '#7c3aed',
    link: 'https://tiki.vn/search?q=nguoi+ban+hang+vi+dai+nhat+the+gioi'
  },
  {
    title: 'Buổi Sáng Diệu Kỳ',
    titleShort: 'Buổi Sáng\nDiệu Kỳ',
    author: 'Hal Elrod',
    reason: 'Kiểm soát buổi sáng — kiểm soát cả cuộc đời.',
    lesson: 'Nghi lễ buổi sáng SAVERS: Silence (thiền), Affirmations (tự khẳng định), Visualization (hình ảnh hóa), Exercise (vận động), Reading (đọc sách), Scribing (ghi chép).',
    coverImage: imgBuoiSang,
    coverGradient: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #fbbf24 100%)',
    glowColor: 'rgba(217, 119, 6, 0.45)',
    textColor: 'text-amber-300',
    accentBg: 'bg-amber-500/10 border-amber-500/20',
    spineColor: '#d97706',
    link: 'https://tiki.vn/search?q=buoi+sang+dieu+ky'
  },
  {
    title: 'Bí Mật Của May Mắn',
    titleShort: 'Bí Mật Của\nMay Mắn',
    author: 'Alex Rovira',
    reason: 'May mắn không tự nhiên đến — nó được tạo ra bởi người chuẩn bị sẵn sàng.',
    lesson: 'May mắn được tạo ra bởi người biết chuẩn bị, kiên nhẫn và hành động đúng thời điểm. Đừng chờ đợi vận may — hãy đi tìm nó.',
    coverImage: imgBiMat,
    coverGradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)',
    glowColor: 'rgba(5, 150, 105, 0.45)',
    textColor: 'text-emerald-300',
    accentBg: 'bg-emerald-500/10 border-emerald-500/20',
    spineColor: '#059669',
    link: 'https://tiki.vn/search?q=bi+mat+cua+may+man'
  },
  {
    title: 'Think and Grow Rich',
    titleShort: 'Think and\nGrow Rich',
    author: 'Napoleon Hill',
    reason: 'Kinh thánh về tư duy thịnh vượng — đã thay đổi hàng triệu cuộc đời.',
    lesson: 'Tư duy là nền tảng của mọi thành công. 13 nguyên tắc làm giàu từ việc nghiên cứu 500 người thành công nhất nước Mỹ.',
    coverImage: imgThinkGrow,
    coverGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 40%, #0ea5e9 70%, #38bdf8 100%)',
    glowColor: 'rgba(2, 132, 199, 0.45)',
    textColor: 'text-sky-300',
    accentBg: 'bg-sky-500/10 border-sky-500/20',
    spineColor: '#0284c7',
    link: 'https://tiki.vn/search?q=nghi+giau+lam+giau'
  },
  {
    title: 'Người Giàu Có Nhất Thành Babylon',
    titleShort: 'Người Giàu\nThành Babylon',
    author: 'George S. Clason',
    reason: 'Nguyên tắc vàng về quản lý tài chính cá nhân từ 4000 năm trước.',
    lesson: 'Quy tắc cốt lõi: Trả công cho bản thân trước — tiết kiệm 10% thu nhập. Để tiền sinh tiền. Bảo vệ tài sản khỏi thua lỗ.',
    coverImage: imgNguoiGiau,
    coverGradient: 'linear-gradient(135deg, #713f12 0%, #ca8a04 50%, #fde047 100%)',
    glowColor: 'rgba(202, 138, 4, 0.45)',
    textColor: 'text-yellow-300',
    accentBg: 'bg-yellow-500/10 border-yellow-500/20',
    spineColor: '#ca8a04',
    link: 'https://tiki.vn/search?q=nguoi+giau+co+nhat+thanh+babylon'
  },
  {
    title: 'Nhà Giả Kim',
    titleShort: 'Nhà\nGiả Kim',
    author: 'Paulo Coelho',
    reason: 'Triết lý về hành trình khám phá "Kho báu cá nhân" của mỗi người.',
    lesson: 'Kho báu thật sự không phải ở đích đến mà ở hành trình. Khi bạn thật sự mong muốn điều gì đó, cả vũ trụ sẽ cùng bạn hiện thực hóa nó.',
    coverImage: imgNhaGiaKim,
    coverGradient: 'linear-gradient(135deg, #881337 0%, #e11d48 50%, #fb7185 100%)',
    glowColor: 'rgba(225, 29, 72, 0.45)',
    textColor: 'text-rose-300',
    accentBg: 'bg-rose-500/10 border-rose-500/20',
    spineColor: '#e11d48',
    link: 'https://tiki.vn/search?q=nha+gia+kim+paulo+coelho'
  }
]

const QUOTES = [
  {
    text: 'Tất cả những gì viết ra mà không có hành động thực tế đi kèm thì cũng chỉ là chữ trên giấy.',
    label: 'Hành động & Thực tế'
  },
  {
    text: 'Giỏi chuyên môn chưa đủ, phải làm sao để khách hàng biết đến mình, và họ khó khăn ở đâu thì mình có mặt ở đó.',
    label: 'Định vị & Giá trị bản thân'
  },
  {
    text: 'Đừng chỉ làm mỗi kỹ thuật thuần túy; hãy coi mọi vấn đề trong công việc và cuộc sống là một bài toán cần giải quyết.',
    label: 'Tư duy & Giải quyết vấn đề'
  }
]

export default function BooksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [openBook, setOpenBook] = useState<Book | null>(null)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quoteVisible, setQuoteVisible] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteVisible(false)
      setTimeout(() => {
        setQuoteIdx(prev => (prev + 1) % QUOTES.length)
        setQuoteVisible(true)
      }, 400)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !user) {
    return <div className="flex h-screen w-screen items-center justify-center bg-slate-950"><Loader2 className="h-10 w-10 animate-spin text-violet-500" /></div>
  }

  const currentQuote = QUOTES[quoteIdx]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      {/* Book detail modal */}
      {openBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setOpenBook(null)}>
          <div className="glass-panel rounded-2xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="relative h-36 overflow-hidden" style={{ background: openBook.coverGradient }}>
              {openBook.coverImage && (
                <Image
                  src={openBook.coverImage}
                  alt={openBook.title}
                  fill
                  className="object-cover object-center opacity-40"
                  sizes="512px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 px-6 pb-4 z-10">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-0.5">{openBook.author}</p>
                <h2 className="text-xl font-extrabold text-white leading-tight">{openBook.title}</h2>
              </div>
              <button onClick={() => setOpenBook(null)}
                className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition-all cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`rounded-xl p-4 border ${openBook.accentBg}`}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Vì sao Mentor khuyên đọc</p>
                <p className={`text-sm italic leading-relaxed ${openBook.textColor}`}>"{openBook.reason}"</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bài học cốt lõi</p>
                <p className="text-sm text-slate-300 leading-relaxed">{openBook.lesson}</p>
              </div>
              <a href={openBook.link} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 cursor-pointer ${openBook.accentBg} ${openBook.textColor} hover:brightness-125`}>
                <ExternalLink className="h-3.5 w-3.5" /> Tìm mua sách
              </a>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto w-full space-y-8">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Tủ Sách Nội Lực</h1>
              <p className="text-sm text-slate-400 mt-0.5">6 cuốn sách gối đầu giường Mentor Anh Phụng khuyên đọc</p>
            </div>
          </div>

          {/* Rotating Quote Banner */}
          <div className="glass-card rounded-2xl p-6 border-amber-500/15 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent" />
            <div className="relative z-10 flex gap-4 items-start">
              <div className="h-10 w-10 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 text-lg mt-0.5">💬</div>
              <div className="flex-1 min-h-[68px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">{currentQuote.label}</span>
                  <div className="flex gap-1">
                    {QUOTES.map((_, i) => (
                      <button key={i}
                        onClick={() => { setQuoteVisible(false); setTimeout(() => { setQuoteIdx(i); setQuoteVisible(true) }, 200) }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === quoteIdx ? 'w-4 bg-amber-400' : 'w-1.5 bg-amber-500/30 hover:bg-amber-500/60'}`}
                      />
                    ))}
                  </div>
                </div>
                <p
                  className="text-sm text-amber-100 italic leading-relaxed font-medium"
                  style={{
                    opacity: quoteVisible ? 1 : 0,
                    transform: quoteVisible ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease'
                  }}
                >
                  "{currentQuote.text}"
                </p>
                <p className="text-xs text-slate-500 mt-2">— Mentor Anh Phụng</p>
              </div>
            </div>
          </div>

          {/* 3D Book Shelf */}
          <div className="relative">
            {/* Ambient shelf glow — subtle top light */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end pb-2">
            {BOOKS.map((book, i) => (
              <div
                key={i}
                onClick={() => setOpenBook(book)}
                className="group cursor-pointer flex flex-col items-center"
                style={{ perspective: '600px', transitionDelay: `${i * 30}ms` }}
              >
                {/* 3D Book wrapper */}
                <div
                  className="relative w-full transition-all duration-500 ease-out group-hover:-translate-y-4 group-hover:scale-[1.03]"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Cover face */}
                  <div
                    className="relative w-full overflow-hidden"
                    style={{
                      aspectRatio: '2/3',
                      borderRadius: '0 6px 6px 0',
                      transform: 'rotateY(-10deg)',
                      transformOrigin: 'left center',
                      boxShadow: `5px 10px 28px ${book.glowColor}, 3px 3px 0 rgba(0,0,0,0.6)`,
                      transition: 'box-shadow 0.5s ease',
                    }}
                  >
                    {book.coverImage ? (
                      <>
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                          sizes="180px"
                        />
                        {/* Gloss overlay — subtle shine from top-left */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/30 pointer-events-none" />
                        {/* Hover shimmer strip */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)' }} />
                      </>
                    ) : (
                      <>
                        {/* Gradient cover for Think and Grow Rich */}
                        <div className="absolute inset-0" style={{ background: book.coverGradient }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20" />
                        <div className="absolute inset-0 flex flex-col justify-between p-3">
                          <p className="text-white font-black text-[11px] leading-tight drop-shadow-lg whitespace-pre-line">{book.titleShort}</p>
                          <p className="text-white/60 text-[9px] font-semibold">{book.author}</p>
                        </div>
                      </>
                    )}
                    {/* Left spine shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
                    {/* Book number */}
                    <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white text-[9px] font-black">{i + 1}</span>
                    </div>
                  </div>

                  {/* Spine side */}
                  <div
                    className="absolute top-0 left-0 bottom-0 w-3"
                    style={{
                      background: `linear-gradient(to right, ${book.spineColor}99, ${book.spineColor}cc)`,
                      transform: 'rotateY(-80deg) translateX(-50%)',
                      transformOrigin: 'right center',
                      borderRadius: '3px 0 0 3px',
                      boxShadow: `-2px 0 8px rgba(0,0,0,0.5)`,
                    }}
                  />

                  {/* Glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: `0 0 35px ${book.glowColor}`,
                      borderRadius: '0 6px 6px 0',
                    }}
                  />
                </div>

                {/* Label below */}
                <div className="mt-3 text-center px-1">
                  <p className="text-[11px] font-semibold text-slate-300 group-hover:text-white transition-colors leading-tight line-clamp-2">
                    {book.title}
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5">{book.author}</p>
                </div>
              </div>
            ))}
            </div>{/* end grid */}
          </div>{/* end relative shelf */}

          {/* Shelf ledge */}
          <div className="relative -mt-1">
            {/* Main ledge line */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {/* Ledge depth */}
            <div className="h-3 bg-gradient-to-b from-white/8 via-white/4 to-transparent" />
            {/* Soft shadow below ledge */}
            <div className="h-6 bg-gradient-to-b from-black/20 to-transparent" />
          </div>

          <div className="text-center pb-8">
            <p className="text-xs text-slate-600">Click vào từng cuốn sách để xem bài học cốt lõi và link tìm mua</p>
          </div>
        </div>
      </main>
    </div>
  )
}

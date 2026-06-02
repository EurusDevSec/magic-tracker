'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { Sparkles, Calendar, TrendingUp, CheckCircle, ChevronRight, LogOut, Heart } from 'lucide-react'

export default function Home() {
  const { user, profile, loading, signOut } = useAuth()

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Glow Blobs */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[500px] h-[500px] bg-gratitude-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">Eurus <span className="text-violet-400">Hub</span></span>
        </div>

        <nav className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 bg-white/5 rounded-md animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300 hidden sm:inline">
                Xin chào, <span className="font-semibold text-white">{profile?.full_name || user.email}</span> ({profile?.role === 'admin' ? 'Admin' : 'Thành viên'})
              </span>
              {profile?.role === 'admin' && (
                <Link href="/dashboard" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                  Dashboard Admin
                </Link>
              )}
              <Link href="/report" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                Báo cáo tiến độ
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-1 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                Đăng nhập
              </Link>
              <Link href="/register" className="glass-panel px-4 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Đăng ký
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-tight">
          Nền tảng báo cáo tiến độ & <br />
          <span className="text-gold-gradient animate-glow">28 Ngày Biết Ơn</span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl">
          Nơi các thành viên team Eurus nộp báo cáo công việc hàng ngày, học tập những kiến thức mới, giải quyết khó khăn và rèn luyện lòng biết ơn để thu hút phép màu cuộc sống.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {loading ? (
            <div className="h-12 w-48 bg-white/5 rounded-xl animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/report"
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20"
              >
                Vào Báo cáo tiến độ <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/magic"
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-amber-600/20"
              >
                Thực hành 28 ngày biết ơn <Heart className="h-5 w-5 text-amber-100 fill-amber-100" />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/20"
            >
              Bắt đầu ngay <ChevronRight className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl text-left">
          {/* Card 1: Daily Work Reports */}
          <div className="glass-card p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-violet-600/20 transition-all duration-300" />
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 mb-6">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Báo Cáo Tiến Độ Hàng Ngày</h3>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Form nhập liệu tối ưu hóa trải nghiệm (UX/UI), tự động lưu nháp giúp thành viên ghi lại nhanh chóng: hôm nay làm gì, học được gì, gặp lỗi gì & hướng giải quyết, và kế hoạch ngày mai.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-violet-400" /> Giao diện nhập liệu từng bước (Step-by-step UX)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-violet-400" /> Tự động lưu nháp (Autosave) tránh mất dữ liệu
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-violet-400" /> Thống kê Dashboard Admin trực quan, phát hiện ngày trống
              </li>
            </ul>
          </div>

          {/* Card 2: Gratitude Challenge */}
          <div className="glass-card glass-card-gold p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gratitude-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-gratitude-500/20 transition-all duration-300" />
            <div className="h-12 w-12 rounded-xl bg-gratitude-500/10 text-gratitude-400 flex items-center justify-center border border-gratitude-500/20 mb-6">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">28 Ngày Thực Hành Biết Ơn</h3>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Theo sát lộ trình của cuốn sách nổi tiếng &quot;The Magic&quot; (Phép Màu). Mỗi ngày là một thử thách khác nhau, giúp thay đổi tư duy, nâng cao năng lượng tích cực cho cả đội ngũ.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gratitude-400" /> Lộ trình 28 ngày trực quan (Gratitude Map)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gratitude-400" /> Hướng dẫn chi tiết bài tập mỗi ngày của sách
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gratitude-400" /> Lưu lại danh sách 10 điều biết ơn & Hòn Đá Nhiệm Màu
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 text-xs text-slate-500 border-t border-white/5 z-10">
        © 2026 Eurus Team. Thiết kế với 💜 sử dụng Next.js, Tailwind CSS & Supabase.
      </footer>
    </div>
  )
}

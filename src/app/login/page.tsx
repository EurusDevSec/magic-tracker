'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, ArrowRight, Lock, Mail, Loader2, KeyRound, X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function LoginPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingAction, setLoadingAction] = useState(false)
  const supabase = createClient()

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotStatus, setForgotStatus] = useState<{ type: 'idle' | 'success' | 'fallback_guide'; message: string }>({
    type: 'idle',
    message: '',
  })

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    setForgotStatus({ type: 'idle', message: '' })

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/profile`,
      })

      if (error) throw error

      setForgotStatus({
        type: 'success',
        message: 'Đã gửi liên kết khôi phục mật khẩu! Vui lòng kiểm tra hộp thư đến và mục Thư rác (Spam).',
      })
    } catch (err: any) {
      // Graceful fallback when Supabase SMTP is unconfigured or blocked
      setForgotStatus({
        type: 'fallback_guide',
        message: 'Dịch vụ gửi thư tự động qua email chưa cấu hình SMTP. Bạn vui lòng liên hệ trực tiếp Quản trị viên / Trưởng nhóm (Thầy Phụng hoặc bạn Hoàng) để được cấp lại mật khẩu ngay trong 30 giây!',
      })
    } finally {
      setForgotLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoadingAction(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      // Redirect happens via useEffect
    } catch (err: any) {
      setErrorMsg(err.message || 'Sai thông tin đăng nhập!')
      setLoadingAction(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-950 overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-gratitude-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 mb-4 animate-float">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
            Chào mừng trở lại
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Đăng nhập để cập nhật tiến độ & thực hành biết ơn
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {errorMsg && (
            <div className="rounded-md bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-400 text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-input block w-full rounded-lg py-2.5 pl-10 pr-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '')
                    setForgotStatus({ type: 'idle', message: '' })
                    setShowForgotModal(true)
                  }}
                  className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input block w-full rounded-lg py-2.5 pl-10 pr-3 text-sm placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loadingAction}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 cursor-pointer shadow-md shadow-violet-600/20"
            >
              {loadingAction ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Đăng nhập <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-slate-400">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl border border-white/10 space-y-5">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Khôi Phục Mật Khẩu</h3>
                <p className="text-xs text-slate-400">Nhận hướng dẫn lấy lại tài khoản</p>
              </div>
            </div>

            {forgotStatus.type === 'success' && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <div className="space-y-1">
                  <p className="font-semibold">{forgotStatus.message}</p>
                </div>
              </div>
            )}

            {forgotStatus.type === 'fallback_guide' && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-200 flex items-start gap-2.5 space-y-1">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-amber-300">Thông báo gửi thư tự động:</p>
                  <p>{forgotStatus.message}</p>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-white/5 text-[11px] text-slate-300 mt-2">
                    <p className="font-bold text-violet-300 mb-1">Cách khôi phục nhanh nhất:</p>
                    <p>Nhắn Trưởng nhóm / Admin chạy câu lệnh đặt lại mật khẩu trong <strong>Supabase SQL Editor</strong> để mở lại tài khoản ngay.</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Email đăng ký của bạn
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ví dụ: 2224802010...tdmu.edu.vn"
                    className="glass-input block w-full rounded-xl py-2.5 pl-10 pr-3 text-sm placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-white/5"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-600/20"
                >
                  {forgotLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Gửi yêu cầu'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, ArrowRight, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loadingAction, setLoadingAction] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!loading && user) {
      router.push('/report')
    }
  }, [user, loading, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoadingAction(true)

    try {
      // 1. Sign up using Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      if (data?.user && data.user.identities?.length === 0) {
        // This email is already registered
        throw new Error('Email này đã được đăng ký tài khoản!')
      }

      if (data?.session) {
        setSuccessMsg('Đăng ký thành công! Đang tự động đăng nhập...')
        // Redirect happens via useEffect
      } else {
        setSuccessMsg('Đăng ký thành công! Vui lòng kiểm tra hộp thư email của bạn để xác nhận tài khoản trước khi đăng nhập.')
        setLoadingAction(false)
        
        // Optional: clear fields
        setFullName('')
        setEmail('')
        setPassword('')
      }
    } catch (err: any) {
      let msg = err.message || 'Đã xảy ra lỗi trong quá trình đăng ký!'
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('limit exceeded') || msg.toLowerCase().includes('too many requests')) {
        msg = 'Giới hạn đăng ký bằng Email hiện tại đã hết lượt (Rate Limit). Vui lòng liên hệ Admin để thêm tài khoản thủ công trực tiếp từ Supabase Dashboard, hoặc thử lại sau.'
      }
      setErrorMsg(msg)
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
            Tạo tài khoản mới
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Trở thành một phần của dự án báo cáo tiến độ và biết ơn
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {errorMsg && (
            <div className="rounded-md bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-400 text-center">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-400 text-center">
              {successMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300">
                Họ và tên
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="glass-input block w-full rounded-lg py-2.5 pl-10 pr-3 text-sm placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

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
                  className="glass-input block w-full rounded-lg py-2.5 pl-10 pr-3 text-sm placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Mật khẩu
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input block w-full rounded-lg py-2.5 pl-10 pr-3 text-sm placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
            <span className="font-semibold text-violet-400">Lưu ý:</span> Tài khoản đăng ký đầu tiên trên hệ thống sẽ tự động được gán quyền <span className="text-violet-300 font-semibold">Admin</span> (được quyền xem Dashboard tổng). Các tài khoản sau sẽ mặc định là <span className="text-violet-300 font-semibold">Thành viên</span>.
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
                  Đăng ký tài khoản <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-slate-400">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

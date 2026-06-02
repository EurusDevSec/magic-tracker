'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Calendar, History, BarChart2,
  Heart, LogOut, User as UserIcon
} from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  const links = [
    { href: '/dashboard', label: 'Bảng Tổng Quan', icon: BarChart2 },
    { href: '/report', label: 'Báo cáo tiến độ', icon: Calendar },
    { href: '/report/history', label: 'Lịch sử báo cáo', icon: History },
    { href: '/magic', label: '28 Ngày Biết Ơn', icon: Heart, magic: true },
    { href: '/profile', label: 'Trang cá nhân', icon: UserIcon },
  ]

  const activeLinkStyle = (href: string, isMagic?: boolean) => {
    const isActive = pathname === href || pathname?.startsWith(href + '/')
    if (!isActive) return 'text-slate-400 hover:text-white hover:bg-white/5'
    return isMagic
      ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500 font-bold'
      : 'bg-violet-600/10 text-violet-400 border-l-2 border-violet-500 font-bold'
  }

  return (
    <aside className="w-full md:w-60 shrink-0 glass-panel md:min-h-screen border-r border-white/5 flex flex-col justify-between py-6 px-4">
      <div className="space-y-7">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3">
          <div className="h-8 w-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30 font-black text-sm">
            ETI
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            ETI <span className="text-violet-400">Tracker</span>
          </span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
          {(() => {
            const avatarUrl = profile?.avatar_url
            if (avatarUrl?.startsWith('preset:')) {
              const presets: Record<string, string> = {
                'preset:violet': 'bg-gradient-to-br from-violet-600 to-indigo-600',
                'preset:cyan': 'bg-gradient-to-br from-cyan-500 to-blue-600',
                'preset:emerald': 'bg-gradient-to-br from-emerald-500 to-teal-600',
                'preset:amber': 'bg-gradient-to-br from-amber-500 to-orange-600',
                'preset:rose': 'bg-gradient-to-br from-rose-500 to-pink-600',
                'preset:purple': 'bg-gradient-to-br from-purple-600 to-fuchsia-600',
              }
              const bgClass = presets[avatarUrl] || 'bg-gradient-to-br from-violet-600 to-indigo-600'
              return (
                <div className={`h-9 w-9 rounded-full ${bgClass} flex items-center justify-center text-white font-bold text-sm shrink-0 border border-white/10`}>
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                </div>
              )
            }

            if (avatarUrl) {
              return (
                <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 border border-white/10 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                </div>
              )
            }

            return (
              <div className="h-9 w-9 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold shrink-0">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
              </div>
            )
          })()}
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{profile?.full_name || 'Thành viên'}</h4>
            <p className="text-xs text-slate-400">{profile?.role === 'admin' ? 'Quản trị viên' : 'Thực tập sinh'}</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${activeLinkStyle(link.href, link.magic)}`}>
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-6 border-t border-white/5">
        <button onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-all duration-150 cursor-pointer">
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import UserAvatar from '@/components/UserAvatar'
import {
  Calendar, History, BarChart2,
  Heart, LogOut, User as UserIcon, Users,
  ChevronLeft, ChevronRight, BookOpen
} from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') {
      setIsCollapsed(true)
    }
    setIsMounted(true)
  }, [])

  const toggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem('sidebar-collapsed', String(nextState))
  }

  const links = [
    { href: '/dashboard', label: 'Bảng Tổng Quan', icon: BarChart2 },
    { href: '/report', label: 'Báo cáo tiến độ', icon: Calendar },
    { href: '/report/history', label: 'Lịch sử báo cáo', icon: History },
    { href: '/report/group', label: 'Họp nhóm định kỳ', icon: Users },
    { href: '/books', label: 'Tủ sách nội lực', icon: BookOpen },
    { href: '/magic', label: '28 Ngày Biết Ơn', icon: Heart, magic: true },
    { href: '/profile', label: 'Trang cá nhân', icon: UserIcon },
  ]

  const activeLinkStyle = (href: string, isMagic?: boolean) => {
    const isActive = pathname === href || pathname?.startsWith(href + '/')
    if (!isActive) return 'text-slate-400 hover:text-white hover:bg-white/5'
    
    const borderStyle = isCollapsed ? '' : 'border-l-2'
    return isMagic
      ? `bg-amber-500/10 text-amber-400 font-bold ${borderStyle} border-amber-500`
      : `bg-violet-600/10 text-violet-400 font-bold ${borderStyle} border-violet-500`
  }

  return (
    <aside className={`w-full shrink-0 glass-panel md:min-h-screen border-r border-white/5 flex flex-col justify-between py-6 relative ${isMounted ? 'transition-all duration-300 ease-in-out' : ''} ${isCollapsed ? 'md:w-20 px-3' : 'md:w-60 px-4'}`}>
      {/* Collapse Toggle Button - Desktop Only */}
      <button
        onClick={toggleCollapse}
        className="hidden md:flex absolute -right-3 top-7 z-50 h-6 w-6 rounded-full border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:border-violet-500/50 items-center justify-center cursor-pointer transition-all duration-300 shadow-md shadow-black/30"
        aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="space-y-7">
        {/* Logo */}
        <div className={`flex items-center gap-2 px-3 transition-all duration-300 ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}>
          <div className="h-8 w-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30 font-black text-sm shrink-0">
            ETI
          </div>
          <span className={`font-extrabold text-lg tracking-tight text-white transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:max-w-0 md:opacity-0 md:w-0' : 'md:max-w-[150px] md:opacity-100'}`}>
            ETI <span className="text-violet-400">Tracker</span>
          </span>
        </div>

        {/* User Card */}
        <div className={`flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 transition-all duration-300 ${isCollapsed ? 'md:p-1.5 md:justify-center' : ''}`}>
          <UserAvatar 
            avatarUrl={profile?.avatar_url} 
            fullName={profile?.full_name || user?.email} 
          />
          <div className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${isCollapsed ? 'md:max-w-0 md:opacity-0 md:w-0 md:ml-0' : 'md:max-w-[150px] md:opacity-100'}`}>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 ${isCollapsed ? 'md:justify-center md:px-0 md:mx-auto md:w-10' : ''} ${activeLinkStyle(link.href, link.magic)}`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:max-w-0 md:opacity-0 md:w-0 md:ml-0' : 'md:max-w-[150px] md:opacity-100'}`}>
                  {link.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-6 border-t border-white/5">
        <button onClick={signOut}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-all duration-300 cursor-pointer ${isCollapsed ? 'md:justify-center md:px-0 md:mx-auto md:w-10' : ''}`}>
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:max-w-0 md:opacity-0 md:w-0 md:ml-0' : 'md:max-w-[150px] md:opacity-100'}`}>
            Đăng xuất
          </span>
        </button>
      </div>
    </aside>
  )
}

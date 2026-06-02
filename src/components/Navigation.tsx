'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  Calendar, 
  History, 
  Sparkles, 
  Heart, 
  LayoutDashboard, 
  LogOut, 
  User as UserIcon 
} from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  const links = [
    { href: '/report', label: 'Báo cáo tiến độ', icon: Calendar, roles: ['admin', 'member'] },
    { href: '/report/history', label: 'Lịch sử báo cáo', icon: History, roles: ['admin', 'member'] },
    { href: '/magic', label: '28 Ngày Biết Ơn', icon: Heart, roles: ['admin', 'member'], magic: true },
    { href: '/dashboard', label: 'Dashboard Admin', icon: LayoutDashboard, roles: ['admin'] },
  ]

  const activeLinkStyle = (href: string, isMagic?: boolean) => {
    const isActive = pathname === href || pathname?.startsWith(href + '/')
    if (!isActive) return 'text-slate-400 hover:text-white hover:bg-white/5'
    
    return isMagic 
      ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500 font-bold' 
      : 'bg-violet-600/10 text-violet-400 border-l-2 border-violet-500 font-bold'
  }

  return (
    <aside className="w-full md:w-64 shrink-0 glass-panel md:min-h-screen border-r border-white/5 flex flex-col justify-between py-6 px-4">
      <div className="space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3">
          <div className="h-8 w-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">Eurus <span className="text-violet-400">Hub</span></span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="h-10 w-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{profile?.full_name || 'Thành viên'}</h4>
            <p className="text-xs text-slate-400 capitalize">{profile?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {links.map((link) => {
            const hasAccess = link.roles.includes(profile?.role || 'member')
            if (!hasAccess) return null
            
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${activeLinkStyle(link.href, link.magic)}`}
              >
                <Icon className={`h-4.5 w-4.5 ${link.magic && pathname === link.href ? 'text-amber-400' : ''}`} />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-6 border-t border-white/5">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

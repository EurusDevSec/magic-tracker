import { User as UserIcon } from 'lucide-react'

interface UserAvatarProps {
  avatarUrl: string | null | undefined
  fullName: string | null | undefined
  sizeClass?: string
  fallbackBg?: string
  fallbackColor?: string
  style?: React.CSSProperties
}

export default function UserAvatar({
  avatarUrl,
  fullName,
  sizeClass = 'h-9 w-9',
  fallbackBg,
  fallbackColor,
  style,
}: UserAvatarProps) {
  const initial = fullName ? fullName.trim().charAt(0).toUpperCase() : '?'

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
      <div className={`${sizeClass} rounded-full ${bgClass} flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/10 shadow-sm`}>
        {initial}
      </div>
    )
  }

  if (avatarUrl) {
    return (
      <div className={`relative ${sizeClass} rounded-full overflow-hidden shrink-0 border border-white/10 bg-slate-900 shadow-sm`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={avatarUrl} 
          alt={fullName || 'Avatar'} 
          className="h-full w-full object-cover animate-fadeIn"
          onError={(e) => {
            // If image fails to load, fallback to text avatar
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    )
  }

  // Fallback with custom styles/colors if provided
  const bg = style ? '' : (fallbackBg || 'bg-violet-500/10')
  const borderAndText = style ? '' : (fallbackColor || 'text-violet-300 border-violet-500/20')
  const borderClass = style ? '' : 'border'
  return (
    <div 
      className={`${sizeClass} rounded-full ${bg} ${borderClass} ${borderAndText} flex items-center justify-center font-bold shrink-0 text-xs shadow-sm`}
      style={style}
    >
      {initial}
    </div>
  )
}

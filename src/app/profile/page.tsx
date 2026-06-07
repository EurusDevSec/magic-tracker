'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import UserAvatar from '@/components/UserAvatar'
import { Loader2, Save, User as UserIcon, Camera, AlertCircle, Check } from 'lucide-react'

// Premium preset gradients for avatar backgrounds
const PRESET_AVATARS = [
  { id: 'preset:violet', name: 'Tím Indigo', bg: 'bg-gradient-to-br from-violet-600 to-indigo-600', text: 'text-white' },
  { id: 'preset:cyan', name: 'Xanh Cyan', bg: 'bg-gradient-to-br from-cyan-500 to-blue-600', text: 'text-white' },
  { id: 'preset:emerald', name: 'Lục Bảo', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-white' },
  { id: 'preset:amber', name: 'Hổ Phách', bg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-white' },
  { id: 'preset:rose', name: 'Hồng Đào', bg: 'bg-gradient-to-br from-rose-500 to-pink-600', text: 'text-white' },
  { id: 'preset:purple', name: 'Tím Đậm', bg: 'bg-gradient-to-br from-purple-600 to-fuchsia-600', text: 'text-white' },
]

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || 'preset:violet')
    }
  }, [profile])

  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
          const img = new Image()
          img.src = event.target?.result as string
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const MAX_SIZE = 128
            let width = img.width
            let height = img.height

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width
                width = MAX_SIZE
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height
                height = MAX_SIZE
              }
            }
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)

            try {
              const compressed = canvas.toDataURL('image/jpeg', 0.8)
              resolve(compressed)
            } catch (err) {
              reject(new Error('Không thể nén ảnh. Hãy thử ảnh khác.'))
            }
          }
          img.onerror = () => reject(new Error('Tệp không phải định dạng ảnh hợp lệ.'))
        }
        reader.onerror = () => reject(new Error('Lỗi đọc tệp.'))
      })

      setAvatarUrl(dataUrl)
      setSuccessMsg('Đã chọn ảnh đại diện từ máy tính! Nhấn "Lưu thay đổi" bên dưới để áp dụng.')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Lỗi khi xử lý ảnh.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Update profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl,
        })
        .eq('id', user.id)

      if (error) throw error

      // 2. Also try to update auth.users metadata to keep in sync
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      })

      // 3. Refresh context state
      await refreshProfile()

      setSuccessMsg('Đã cập nhật thông tin cá nhân thành công!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setErrorMsg(err.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại!')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100">
      <Navigation />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto w-full">
          {/* Title */}
          <div className="mb-8 border-b border-white/5 pb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-1">Cài Đặt Hệ Thống</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">👤 Trang Cá Nhân</h1>
            <p className="text-slate-400 text-sm mt-1">Cập nhật họ tên hiển thị và ảnh đại diện của bạn.</p>
          </div>

          <div className="max-w-2xl">
            {/* Alert messages */}
            {errorMsg && (
              <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 flex items-center gap-2 animate-fadeIn">
                <Check className="h-5 w-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <form onSubmit={handleSave} className="space-y-6">

                {/* Avatar section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
                  <div className="relative group">
                    <UserAvatar avatarUrl={avatarUrl} fullName={fullName} sizeClass="h-24 w-24 text-4xl" />
                    <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-violet-600 border-2 border-slate-950 flex items-center justify-center text-white shadow-lg">
                      <Camera className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-sm font-bold text-white mb-1">Ảnh đại diện</h3>
                    <p className="text-xs text-slate-400 mb-3">Chọn màu gradient có sẵn, tải ảnh lên từ máy tính hoặc nhập link ảnh bên dưới.</p>

                    {/* Preset Avatar buttons & Upload button */}
                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                      <div className="flex flex-wrap gap-2">
                        {PRESET_AVATARS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setAvatarUrl(preset.id)}
                            className={`h-8 w-8 rounded-full ${preset.bg} border-2 transition-transform hover:scale-110 cursor-pointer ${avatarUrl === preset.id ? 'border-white ring-2 ring-violet-500' : 'border-transparent'}`}
                            title={preset.name}
                          />
                        ))}
                      </div>

                      <div className="h-4 w-px bg-white/10 hidden sm:block" />

                      <div>
                        <input
                          type="file"
                          id="avatarFileInput"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                        <label
                          htmlFor="avatarFileInput"
                          className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-white border border-violet-500/20 hover:border-violet-500 px-3 py-1.5 rounded-xl bg-violet-500/5 hover:bg-violet-500/10 transition-all cursor-pointer"
                        >
                          {uploading ? 'Đang nén...' : 'Tải ảnh từ máy tính'}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input fields */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Địa chỉ Email (Không thể đổi)
                    </label>
                    <input
                      id="email"
                      type="email"
                      disabled
                      value={profile?.email || user.email || ''}
                      className="glass-input block w-full rounded-xl py-2.5 px-4 text-sm bg-slate-900/60 text-slate-500 cursor-not-allowed border-white/5"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Quyền Hạn Tài Khoản
                    </label>
                    <input
                      id="role"
                      type="text"
                      disabled
                      value={profile?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Thực tập sinh (Member)'}
                      className="glass-input block w-full rounded-xl py-2.5 px-4 text-sm bg-slate-900/60 text-slate-500 cursor-not-allowed border-white/5"
                    />
                  </div>

                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Họ và tên hiển thị
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="glass-input block w-full rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="avatarCustom" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Hoặc dùng Link Ảnh Tự Chọn (Image URL)
                    </label>
                    <input
                      id="avatarCustom"
                      type="url"
                      value={avatarUrl?.startsWith('preset:') ? '' : avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value || 'preset:violet')}
                      placeholder="https://images.unsplash.com/... (để trống nếu dùng màu ở trên)"
                      className="glass-input block w-full rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="bg-white/5 hover:bg-white/10 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all cursor-pointer border border-white/5"
                  >
                    Quay lại
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-600/20"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

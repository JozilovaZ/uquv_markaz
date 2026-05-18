import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'


export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Xush kelibsiz, ${user.firstName}!`)
      const routes = { admin: '/admin', manager: '/manager', teacher: '/teacher', user: '/student', student: '/student' }
      navigate(routes[user.role] || '/student', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login xatosi')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-700/10 rounded-full blur-3xl"/>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-glow-lg">🎓</div>
          <h1 className="text-3xl font-bold text-white">EduCore</h1>
          <p className="text-gray-400 mt-1 text-sm">Professional LMS Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-card">
          <h2 className="text-xl font-bold text-white mb-6">Tizimga kirish</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">✉️</span>
                <input type="email" required placeholder="email@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-10"/>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Parol</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔒</span>
                <input type="password" required placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-10"/>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 mt-2 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Tekshirilmoqda...
                </span>
              ) : 'Kirish →'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">Hisob yo'qmi? <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Ro'yxatdan o'ting</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

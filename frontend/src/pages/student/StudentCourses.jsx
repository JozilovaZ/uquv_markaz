import { useState, useEffect } from 'react'
import { enrollmentsAPI } from '../../services/api'
import { Card, Badge, PageHeader, Spinner } from '../../components/ui'

const fmt = n => n ? new Intl.NumberFormat('uz-UZ').format(n) + ' so\'m' : 'Bepul'
const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    enrollmentsAPI.list()
      .then(r => setEnrollments(r.data || []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  const filtered = enrollments.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Mening kurslarim"
        subtitle={`${enrollments.length} ta kursga yozilgansiz`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3 text-center border border-surface-border">
          <p className="text-xl font-extrabold text-white">{enrollments.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Jami kurs</p>
        </div>
        <div className="glass rounded-xl p-3 text-center border border-surface-border">
          <p className="text-xl font-extrabold text-green-400">
            {enrollments.filter(e => e.status === 'active').length || enrollments.length}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Faol</p>
        </div>
        <div className="glass rounded-xl p-3 text-center border border-surface-border col-span-2 sm:col-span-1">
          <p className="text-xl font-extrabold text-primary-300">
            {[...new Set(enrollments.map(e => e.category).filter(Boolean))].length}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Yo'nalish</p>
        </div>
      </div>

      {/* Search */}
      {enrollments.length > 0 && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Kurs nomi bo'yicha qidirish..."
          className="input-field w-full text-sm"
        />
      )}

      {/* Course list */}
      {enrollments.length === 0 ? (
        <Card>
          <div className="text-center py-14">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-white font-semibold mb-1">Hali hech qanday kursga yozilmagan</p>
            <p className="text-gray-500 text-sm">Administrator yoki menejer orqali kurslarga yoziling</p>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-gray-500 text-sm">Kurs topilmadi</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(e => (
            <div key={e.id} className="glass rounded-2xl p-4 border border-surface-border hover:border-primary-500/30 transition-all space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">📚</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm leading-snug">{e.title}</h3>
                  {e.center && <p className="text-xs text-gray-400 mt-0.5">🏛 {e.center}</p>}
                </div>
              </div>

              {/* Category + status */}
              <div className="flex items-center gap-2 flex-wrap">
                {e.category && <Badge color="purple">{e.category}</Badge>}
                <Badge color="green">✅ Yozilgan</Badge>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                {e.duration && <span>⏱ {e.duration}</span>}
                {e.price != null && <span>💰 {fmt(e.price)}</span>}
                {e.created_at && (
                  <span className="col-span-2">📅 Yozilgan: {fmtDate(e.created_at)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { teacherCoursesAPI } from '../../services/api'
import { Card, Badge, PageHeader, Spinner, EmptyState, Modal } from '../../components/ui'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(n || 0)

export default function TeacherCourses() {
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    teacherCoursesAPI.myList()
      .then(r => setCourses(r.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Kurslar" subtitle={`${courses.length} ta kurs`}/>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Kurs qidirish..."
          className="input-field pl-10"/>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📚" title="Kurs topilmadi"/>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)}
              className="glass rounded-2xl p-5 border border-transparent hover:border-primary-500/40 cursor-pointer transition-all hover:-translate-y-1">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 bg-primary-500/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">📚</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">{c.category}</span>
                  <h3 className="font-bold text-white text-sm mt-1 leading-snug">{c.title}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4">
                {c.day  && <span>📅 {c.day}</span>}
                {c.time && <span>⏰ {c.time}</span>}
                {c.duration && <span>⏱ {c.duration}</span>}
                {c.price > 0 && <span className="text-primary-400 font-semibold">{fmt(c.price)} so'm</span>}
              </div>

              {c.teacher_name ? (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <span className="text-base">👨‍🏫</span>
                  <div>
                    <p className="text-xs font-semibold text-green-300">{c.teacher_name}</p>
                    {c.teacher_subject && <p className="text-[10px] text-gray-500">{c.teacher_subject}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600">👨‍🏫 O'qituvchi belgilanmagan</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge color="purple">{selected.category}</Badge>
              {selected.price > 0 && <Badge color="green">{fmt(selected.price)} so'm</Badge>}
            </div>

            {selected.description && (
              <p className="text-sm text-gray-300">{selected.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                selected.day      && ['📅', 'Kun',     selected.day],
                selected.time     && ['⏰', 'Vaqt',    selected.time],
                selected.duration && ['⏱', 'Davomiylik', selected.duration],
                selected.center   && ['🏛', 'Markaz',  selected.center],
              ].filter(Boolean).map(([icon, label, value]) => (
                <div key={label} className="bg-surface-hover rounded-xl p-3 border border-surface-border">
                  <p className="text-xs text-gray-500">{icon} {label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {selected.teacher_name && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-xs text-gray-500 mb-2">👨‍🏫 O'qituvchi</p>
                <p className="font-bold text-green-300">{selected.teacher_name}</p>
                {selected.teacher_subject && <p className="text-xs text-gray-400 mt-0.5">{selected.teacher_subject}</p>}
                {selected.teacher_phone   && <p className="text-xs text-gray-400">{selected.teacher_phone}</p>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

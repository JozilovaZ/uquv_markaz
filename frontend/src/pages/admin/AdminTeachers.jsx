import { useState, useEffect } from 'react'
import { adminTeachersAPI } from '../../services/api'
import { Card, Badge, PageHeader, Modal, Spinner, EmptyState, Avatar, StatCard } from '../../components/ui'

const CAT_COLORS = { IT:'purple', Til:'blue', Dizayn:'green', Fan:'yellow', Marketing:'red' }

function catColor(subject) {
  if (!subject) return 'gray'
  for (const [k, v] of Object.entries(CAT_COLORS)) {
    if (subject.includes(k)) return v
  }
  return 'gray'
}

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all') // all | assigned | free
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    adminTeachersAPI.list()
      .then(r => setTeachers(r.data || []))
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = teachers.filter(t => {
    const s = search.toLowerCase()
    const matchSearch = t.name.toLowerCase().includes(s) || t.subject.toLowerCase().includes(s)
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'assigned' ? !!t.course_id :
                              !t.course_id
    return matchSearch && matchFilter
  })

  const withCourse    = teachers.filter(t=>t.course_id).length
  const withoutCourse = teachers.filter(t=>!t.course_id).length
  const totalStudents = teachers.reduce((s,t)=>s+(t.student_count||0),0)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="O'qituvchilar ro'yxati"
        subtitle={`Qabul qilingan arizalar — jami ${teachers.length} ta o'qituvchi`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Jami o'qituvchi"  value={teachers.length}   icon="👨‍🏫" color="purple"/>
        <StatCard title="Kurs belgilangan"  value={withCourse}        icon="✅"   color="green"/>
        <StatCard title="Kurs yo'q"         value={withoutCourse}     icon="⏳"   color="yellow"/>
        <StatCard title="Jami o'quvchilar"  value={totalStudents}     icon="🎒"   color="blue"/>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Ism yoki yo'nalish bo'yicha qidirish..."
              className="input-field pl-10"/>
          </div>
          <div className="flex gap-1.5">
            {[['all','Barchasi'],['assigned','Kurs bor'],['free','Kurs yo\'q']].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter===v ? 'bg-primary-500 text-white shadow-glow' : 'glass border border-surface-border text-gray-400 hover:text-white'
                }`}>{l}</button>
            ))}
          </div>
        </div>

        {filtered.length===0 ? <EmptyState icon="👨‍🏫" title="O'qituvchi topilmadi"/> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(t=>(
              <div key={t.id} onClick={()=>setSelected(t)}
                className="glass rounded-xl p-4 border border-surface-border hover:border-primary-500/40 transition-all cursor-pointer hover:-translate-y-0.5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar name={t.name} size="md"/>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm leading-tight truncate">{t.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{t.subject}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge color={catColor(t.subject)} className="text-[10px]">
                        {t.subject?.split('/')[0]?.trim()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Course badge */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-3 ${
                  t.course_id
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-surface-hover border border-surface-border'
                }`}>
                  <span>{t.course_id ? '📚' : '➕'}</span>
                  <span className={t.course_id ? 'text-green-300 font-semibold truncate' : 'text-gray-500'}>
                    {t.course_title || "Kurs belgilanmagan"}
                  </span>
                  {t.course_category && (
                    <span className="ml-auto text-gray-500 flex-shrink-0">{t.course_category}</span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-surface-hover rounded-lg py-2">
                    <p className="text-sm font-bold text-blue-300">{t.student_count || 0}</p>
                    <p className="text-[9px] text-gray-500">O'quvchi</p>
                  </div>
                  <div className="bg-surface-hover rounded-lg py-2">
                    <p className="text-sm font-bold text-white truncate px-1">{t.experience}</p>
                    <p className="text-[9px] text-gray-500">Tajriba</p>
                  </div>
                  <div className="bg-surface-hover rounded-lg py-2">
                    <p className="text-sm font-bold text-green-400">✅</p>
                    <p className="text-[9px] text-gray-500">Qabul</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={()=>setSelected(null)} title="O'qituvchi ma'lumotlari" size="lg">
        {selected && (
          <div className="space-y-5">
            {/* Profile */}
            <div className="flex items-center gap-4 p-4 bg-surface-hover rounded-xl">
              <Avatar name={selected.name} size="lg"/>
              <div>
                <h3 className="font-bold text-white text-lg">{selected.name}</h3>
                <p className="text-sm text-gray-400">{selected.subject}</p>
                <Badge color="green" className="mt-1">Qabul qilingan</Badge>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['✉️ Email',   selected.email],
                ['📞 Telefon', selected.phone || '—'],
                ['⏱ Tajriba', selected.experience],
                ['📅 Ariza sana', selected.created_at ? new Date(selected.created_at).toLocaleDateString('uz-UZ') : '—'],
              ].map(([label,val])=>(
                <div key={label} className="bg-surface-hover rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">{label}</p>
                  <p className="text-gray-200 font-medium break-all">{val}</p>
                </div>
              ))}
            </div>

            {/* Assigned course */}
            <div className={`p-4 rounded-xl border ${selected.course_id ? 'bg-green-500/10 border-green-500/30' : 'bg-surface-hover border-surface-border'}`}>
              <p className="text-xs text-gray-500 mb-2">📚 Biriktirilgan kurs</p>
              {selected.course_id ? (
                <div>
                  <p className="font-bold text-green-300">{selected.course_title}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge color={CAT_COLORS[selected.course_category]||'gray'}>{selected.course_category}</Badge>
                    <span className="text-xs text-gray-400">👥 {selected.student_count || 0} ta o'quvchi</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Hozirda kurs belgilanmagan. Kurslar bo'limidan biriktiring.</p>
              )}
            </div>

            {selected.cv_filename && (
              <a href={`/media/cvs/${selected.cv_filename}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-primary-400 hover:text-primary-300 font-semibold text-sm border border-primary-500/30 px-4 py-3 rounded-xl hover:bg-primary-500/10 transition-all w-fit">
                📄 CV / Rezyumeni ko'rish
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

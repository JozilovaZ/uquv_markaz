import { useState, useEffect } from 'react'
import { coursesAPI, coursePaymentsAPI, enrollmentsAPI, managerStudentsAPI, studentsAPI } from '../../services/api'
import { Card, Button, Badge, Avatar, Modal, Input, PageHeader, Spinner, EmptyState } from '../../components/ui'
import toast from 'react-hot-toast'

const PAY_STATUS = {
  paid:    { label: "To'ladi",    color: 'green',  bg: 'bg-green-500/10 border-green-500/20'   },
  pending: { label: 'Kutilmoqda', color: 'yellow', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  unpaid:  { label: 'Qarzdor',    color: 'red',    bg: 'bg-red-500/10 border-red-500/20'       },
}
const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
const fmt = n => new Intl.NumberFormat('uz-UZ').format(n || 0)

export default function ManagerCourses() {
  const [courses,   setCourses]   = useState([])
  const [detail,    setDetail]    = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search,    setSearch]    = useState('')
  const [allStudents, setAllStudents] = useState([])

  // modals
  const [editModal, setEditModal]   = useState(null) // student object
  const [enrollModal, setEnrollModal] = useState(false)
  const [editForm,  setEditForm]    = useState({ firstName: '', email: '' })
  const [enrollId,  setEnrollId]    = useState('')
  const [saving,    setSaving]      = useState(false)

  useEffect(() => {
    Promise.all([
      coursesAPI.list().then(r => r.data).catch(() => []),
      managerStudentsAPI.list().then(r => r.data).catch(() => []),
    ]).then(([c, s]) => { setCourses(c); setAllStudents(s) })
    .finally(() => setLoading(false))
  }, [])

  async function selectCourse(c) {
    setSelected(c)
    setDetail(null)
    setDetailLoading(true)
    try { const r = await coursePaymentsAPI.get(c.id); setDetail(r.data) }
    catch { setDetail(null) }
    finally { setDetailLoading(false) }
  }

  async function refreshDetail() {
    if (!selected) return
    try { const r = await coursePaymentsAPI.get(selected.id); setDetail(r.data) }
    catch {}
  }

  async function handleEditStudent(e) {
    e.preventDefault(); setSaving(true)
    try {
      await studentsAPI.update(editModal.id, { firstName: editForm.firstName, email: editForm.email })
      toast.success('Yangilandi')
      await refreshDetail(); setEditModal(null)
    } catch { toast.error('Xatolik') }
    finally { setSaving(false) }
  }

  async function handleRemoveStudent(enrollId) {
    if (!confirm("O'quvchini bu kursdan chiqarishni tasdiqlaysizmi?")) return
    try {
      await enrollmentsAPI.delete(enrollId)
      toast.success("O'chirildi")
      await refreshDetail()
    } catch { toast.error('Xatolik') }
  }

  async function handleEnroll(e) {
    e.preventDefault(); setSaving(true)
    try {
      await enrollmentsAPI.create({ user_id: enrollId, course_id: selected.id })
      toast.success('Yozildi')
      // refresh all students list and detail
      const [s, r] = await Promise.all([managerStudentsAPI.list().then(x=>x.data), coursePaymentsAPI.get(selected.id).then(x=>x.data)])
      setAllStudents(s); setDetail(r); setEnrollModal(false); setEnrollId('')
    } catch(err) { toast.error(err.response?.data?.error || 'Xatolik') }
    finally { setSaving(false) }
  }

  const filteredCourses = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  )

  // Students NOT enrolled in selected course
  const enrolledIds = new Set(detail?.students?.map(s => s.id) || [])
  const availableStudents = allStudents.filter(s => !enrolledIds.has(s.id))

  const paidCount   = detail?.students?.filter(s => s.payment_status === 'paid').length   || 0
  const unpaidCount = detail?.students?.filter(s => s.payment_status !== 'paid').length   || 0

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Kurslar" subtitle={`${courses.length} ta kurs — kursni bosib tafsilot ko'ring`}/>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* LEFT — courses */}
        <div className="lg:col-span-2 space-y-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Kurs qidirish..." className="input-field w-full text-sm"/>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredCourses.map(c => (
              <button key={c.id} onClick={() => selectCourse(c)}
                className={`w-full text-left glass rounded-xl p-3.5 border transition-all hover:border-primary-500/40 ${
                  selected?.id === c.id ? 'border-primary-500 bg-primary-500/10' : 'border-transparent'
                }`}>
                <p className="font-semibold text-white text-sm leading-snug">{c.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span className="bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">{c.category}</span>
                  {c.teacher_name
                    ? <span className="text-green-400">👨‍🏫 {c.teacher_name}</span>
                    : <span className="text-gray-600">👨‍🏫 O'qituvchi yo'q</span>
                  }
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="flex flex-col items-center justify-center py-20">
              <div className="text-5xl mb-3">📚</div>
              <p className="text-gray-400 font-semibold">Kursni tanlang</p>
              <p className="text-gray-600 text-sm mt-1">Chap tomondagi kursga bosing</p>
            </Card>
          ) : detailLoading ? (
            <Card className="flex justify-center py-20"><Spinner size="lg"/></Card>
          ) : !detail ? (
            <Card><EmptyState icon="⚠️" title="Ma'lumot yuklanmadi"/></Card>
          ) : (
            <div className="space-y-4">
              {/* Course info */}
              <Card>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-primary-500/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">📚</div>
                  <div className="flex-1">
                    <h2 className="font-bold text-white text-base leading-snug">{detail.course?.title}</h2>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                      <span>📂 {detail.course?.category}</span>
                      <span>🏛 {detail.course?.center}</span>
                      <span className="text-primary-400 font-bold">{fmt(detail.course?.price)} so'm</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Teacher */}
              {detail.teacher && (
                <Card>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">👨‍🏫 O'qituvchi</p>
                  <div className="flex items-center gap-3">
                    <Avatar name={detail.teacher.name} size="md"/>
                    <div>
                      <p className="font-bold text-white">{detail.teacher.name}</p>
                      <p className="text-xs text-primary-400">{detail.teacher.subject}</p>
                      <p className="text-xs text-gray-400">{detail.teacher.experience}{detail.teacher.phone ? ' · ' + detail.teacher.phone : ''}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass rounded-xl p-3 text-center border border-surface-border">
                  <p className="text-xl font-bold text-white">{detail.students?.length || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Jami o'quvchi</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-green-500/20">
                  <p className="text-xl font-bold text-green-400">{paidCount}</p>
                  <p className="text-xs text-gray-400 mt-1">To'ladi</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-red-500/20">
                  <p className="text-xl font-bold text-red-400">{unpaidCount}</p>
                  <p className="text-xs text-gray-400 mt-1">To'lamadi</p>
                </div>
              </div>

              {/* Students */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-white">O'quvchilar ro'yxati</p>
                  <Button size="sm" onClick={() => setEnrollModal(true)}>➕ Qo'shish</Button>
                </div>
                {detail.students?.length === 0 ? (
                  <EmptyState icon="🎒" title="Hali o'quvchi yo'q"/>
                ) : (
                  <div className="space-y-2">
                    {detail.students.map(s => {
                      const ps = PAY_STATUS[s.payment_status] || PAY_STATUS.unpaid
                      return (
                        <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${ps.bg}`}>
                          <Avatar name={s.firstName} size="sm"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{s.firstName}</p>
                            <p className="text-xs text-gray-500 truncate">{s.email}</p>
                          </div>
                          <div className="flex-shrink-0 text-right hidden sm:block">
                            <p className="text-xs text-gray-500">{fmtDate(s.enrolled_at)}</p>
                          </div>
                          <Badge color={ps.color}>{ps.label}</Badge>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => { setEditModal(s); setEditForm({ firstName: s.firstName, email: s.email }) }}
                              className="text-xs text-primary-400 border border-primary-500/30 px-2 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all">✏️</button>
                            <button onClick={() => handleRemoveStudent(s.enrollment_id)}
                              className="text-xs text-red-400 border border-red-500/30 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">✕</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Edit student modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="O'quvchini tahrirlash">
        {editModal && (
          <form onSubmit={handleEditStudent} className="space-y-4">
            <Input label="Ism Familiya" required value={editForm.firstName}
              onChange={e => setEditForm({...editForm, firstName: e.target.value})}/>
            <Input label="Email" type="email" required value={editForm.email}
              onChange={e => setEditForm({...editForm, email: e.target.value})}/>
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving} className="flex-1">💾 Saqlash</Button>
              <Button type="button" variant="secondary" onClick={() => setEditModal(null)} className="flex-1">Bekor</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Enroll student modal */}
      <Modal open={enrollModal} onClose={() => setEnrollModal(false)} title="O'quvchini kursga yozish">
        <form onSubmit={handleEnroll} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">O'quvchi tanlang</label>
            <select className="input-field" required value={enrollId}
              onChange={e => setEnrollId(e.target.value)}>
              <option value="">— O'quvchi —</option>
              {availableStudents.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} ({s.email})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="flex-1">➕ Yozish</Button>
            <Button type="button" variant="secondary" onClick={() => setEnrollModal(false)} className="flex-1">Bekor</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

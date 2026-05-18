import { useState, useEffect } from 'react'
import { managerStudentsAPI, studentsAPI, coursesAPI, enrollmentsAPI } from '../../services/api'
import { Card, Button, Badge, Avatar, Modal, Input, PageHeader, Spinner, EmptyState } from '../../components/ui'
import toast from 'react-hot-toast'

const EMPTY_FORM = { firstName: '', email: '', password: '123456', course_id: '' }

export default function ManagerStudents() {
  const [students, setStudents] = useState([])
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [modal,    setModal]    = useState(null) // 'add' | 'edit' | 'detail'
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [editId,   setEditId]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [s, c] = await Promise.all([
        managerStudentsAPI.list().then(r => r.data),
        coursesAPI.list().then(r => r.data),
      ])
      setStudents(s)
      setCourses(c)
    } catch { toast.error('Yuklashda xatolik') }
    finally { setLoading(false) }
  }

  function openAdd()  { setForm(EMPTY_FORM); setModal('add') }
  function openEdit(s){ setEditId(s.id); setForm({ firstName: s.firstName, email: s.email, password: '', course_id: '' }); setModal('edit') }
  function openDetail(s){ setSelected(s); setModal('detail') }

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await studentsAPI.create({ firstName: form.firstName, email: form.email, password: form.password || '123456' })
      const newId = r.data?.id
      if (newId && form.course_id) {
        await enrollmentsAPI.create({ user_id: newId, course_id: form.course_id }).catch(() => {})
      }
      toast.success("O'quvchi qo'shildi")
      await load(); setModal(null)
    } catch(err) { toast.error(err.response?.data?.error || 'Xatolik') }
    finally { setSaving(false) }
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await studentsAPI.update(editId, { firstName: form.firstName, email: form.email })
      toast.success('Yangilandi')
      await load(); setModal(null)
    } catch { toast.error('Xatolik') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm("O'quvchini o'chirishni tasdiqlaysizmi?")) return
    try {
      await studentsAPI.delete(id)
      setStudents(s => s.filter(x => x.id !== id))
      toast.success("O'chirildi")
    } catch { toast.error('Xatolik') }
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return s.firstName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
  })

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="O'quvchilar"
        subtitle={`Jami: ${students.length} ta o'quvchi`}
        action={<Button onClick={openAdd}>➕ O'quvchi qo'shish</Button>}
      />

      <Card>
        <div className="relative mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism yoki email bo'yicha qidirish..."
            className="input-field pl-10"/>
        </div>

        {filtered.length === 0 ? <EmptyState icon="🎒" title="O'quvchi topilmadi"/> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">№</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">O'quvchi</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Kurslar</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const courseList = s.courses ? s.courses.split(' || ').filter(Boolean) : []
                  return (
                    <tr key={s.id} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-3 text-gray-600 text-xs">{i+1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.firstName || '?'} size="sm"/>
                          <span className="font-semibold text-white text-sm">{s.firstName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-400 text-sm">{s.email}</td>
                      <td className="py-3 px-3">
                        {courseList.length === 0 ? (
                          <span className="text-gray-600 text-xs">Kurs yo'q</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {courseList.slice(0, 2).map((c, ci) => (
                              <span key={ci} className="text-[10px] bg-primary-500/15 text-primary-300 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">{c}</span>
                            ))}
                            {courseList.length > 2 && (
                              <span className="text-[10px] bg-surface-hover text-gray-400 px-2 py-0.5 rounded-full">+{courseList.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openDetail(s)}
                            className="text-xs text-gray-400 hover:text-white border border-surface-border px-2.5 py-1.5 rounded-lg hover:bg-surface-hover transition-all">
                            👁
                          </button>
                          <button onClick={() => openEdit(s)}
                            className="text-xs text-primary-400 hover:text-primary-300 border border-primary-500/30 px-2.5 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all">
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(s.id)}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add modal */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Yangi o'quvchi qo'shish">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Ism Familiya" required value={form.firstName}
            onChange={e => setForm({...form, firstName: e.target.value})} placeholder="Jasur Toshmatov"/>
          <Input label="Email" type="email" required value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} placeholder="jasur@example.com"/>
          <Input label="Parol" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} placeholder="123456"/>
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Kursga yozish (ixtiyoriy)</label>
            <select className="input-field" value={form.course_id}
              onChange={e => setForm({...form, course_id: e.target.value})}>
              <option value="">— Kurs tanlang —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="flex-1">💾 Saqlash</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="O'quvchini tahrirlash">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Ism Familiya" required value={form.firstName}
            onChange={e => setForm({...form, firstName: e.target.value})} placeholder="Jasur Toshmatov"/>
          <Input label="Email" type="email" required value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} placeholder="jasur@example.com"/>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="flex-1">💾 Saqlash</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal open={modal === 'detail'} onClose={() => setModal(null)} title="O'quvchi ma'lumotlari">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-surface-hover rounded-xl">
              <Avatar name={selected.firstName} size="lg"/>
              <div>
                <h3 className="font-bold text-white text-lg">{selected.firstName}</h3>
                <p className="text-sm text-gray-400">{selected.email}</p>
                <Badge color="green" className="mt-1">{selected.enrollment_count} ta kurs</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Yozilgan kurslar</p>
              {selected.courses ? (
                <div className="space-y-2">
                  {selected.courses.split(' || ').filter(Boolean).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-surface-hover rounded-lg">
                      <span className="text-primary-400">📚</span>
                      <span className="text-sm text-gray-200">{c}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Hozircha kurs yo'q</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

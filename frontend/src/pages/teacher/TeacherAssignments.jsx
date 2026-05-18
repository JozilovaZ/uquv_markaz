import { useState, useEffect } from 'react'
import { assignmentsAPI, submissionsAPI, teacherCoursesAPI } from '../../services/api'
import { Card, Button, Badge, Avatar, Modal, Input, PageHeader, Spinner, EmptyState } from '../../components/ui'
import toast from 'react-hot-toast'

const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
const fmtDateTime = d => d ? new Date(d).toLocaleString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

const SUB_STATUS = {
  not_submitted: { label: 'Topshirilmagan', color: 'gray'   },
  pending:       { label: 'Tekshirilmoqda', color: 'yellow' },
  graded:        { label: 'Baholangan',     color: 'green'  },
}

const EMPTY_FORM = { title: '', description: '', deadline: '', course_id: '' }

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([])
  const [selected,    setSelected]    = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [courses,     setCourses]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [subLoading,  setSubLoading]  = useState(false)

  const [createModal, setCreateModal] = useState(false)
  const [editModal,   setEditModal]   = useState(null)
  const [gradeModal,  setGradeModal]  = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [gradeForm,   setGradeForm]   = useState({ grade: '', feedback: '' })
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    Promise.all([
      assignmentsAPI.list().then(r => r.data).catch(() => []),
      teacherCoursesAPI.myList().then(r => r.data).catch(() => []),
    ]).then(([a, c]) => { setAssignments(a); setCourses(c) })
    .finally(() => setLoading(false))
  }, [])

  async function selectAssignment(a) {
    setSelected(a); setSubmissions([]); setSubLoading(true)
    try { const r = await submissionsAPI.list({ assignment_id: a.id }); setSubmissions(r.data) }
    catch { setSubmissions([]) }
    finally { setSubLoading(false) }
  }

  async function refreshSelected(a) {
    try { const r = await submissionsAPI.list({ assignment_id: (a || selected).id }); setSubmissions(r.data) }
    catch {}
  }

  async function reloadAssignments() {
    try { const r = await assignmentsAPI.list(); setAssignments(r.data) }
    catch {}
  }

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true)
    try {
      await assignmentsAPI.create({ ...form, course_id: Number(form.course_id) })
      toast.success('Topshiriq yaratildi')
      await reloadAssignments(); setCreateModal(false); setForm(EMPTY_FORM)
    } catch { toast.error('Xatolik') }
    finally { setSaving(false) }
  }

  async function handleEdit(e) {
    e.preventDefault(); setSaving(true)
    try {
      await assignmentsAPI.update(editModal.id, { ...form, course_id: Number(form.course_id) })
      toast.success('Yangilandi')
      await reloadAssignments()
      if (selected?.id === editModal.id) setSelected({ ...selected, ...form })
      setEditModal(null); setForm(EMPTY_FORM)
    } catch { toast.error('Xatolik') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm("Topshiriqni o'chirishni tasdiqlaysizmi?")) return
    try {
      await assignmentsAPI.delete(id)
      toast.success("O'chirildi")
      if (selected?.id === id) { setSelected(null); setSubmissions([]) }
      await reloadAssignments()
    } catch { toast.error('Xatolik') }
  }

  async function handleGrade(e) {
    e.preventDefault(); setSaving(true)
    try {
      await submissionsAPI.grade(gradeModal.submission_id, {
        grade: Number(gradeForm.grade),
        feedback: gradeForm.feedback,
      })
      toast.success('Baholandi')
      await refreshSelected(); setGradeModal(null)
    } catch { toast.error('Xatolik') }
    finally { setSaving(false) }
  }

  function openEdit(a) {
    setForm({ title: a.title, description: a.description || '', deadline: a.deadline || '', course_id: String(a.course_id) })
    setEditModal(a)
  }

  function gradeColor(g) {
    if (g >= 86) return 'text-green-400'
    if (g >= 71) return 'text-blue-400'
    if (g >= 56) return 'text-yellow-400'
    return 'text-red-400'
  }

  const notSubmitted = submissions.filter(s => s.status === 'not_submitted').length
  const pending      = submissions.filter(s => s.status === 'pending').length
  const graded       = submissions.filter(s => s.status === 'graded').length

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Topshiriqlar" subtitle={`${assignments.length} ta topshiriq`}
        action={<Button onClick={() => { setForm(EMPTY_FORM); setCreateModal(true) }}>➕ Topshiriq qo'shish</Button>}/>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* LEFT — assignments list */}
        <div className="lg:col-span-2 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
          {assignments.length === 0 ? (
            <Card><EmptyState icon="📝" title="Topshiriqlar yo'q" subtitle="Yangi topshiriq qo'shing"/></Card>
          ) : assignments.map(a => (
            <button key={a.id} onClick={() => selectAssignment(a)}
              className={`w-full text-left glass rounded-xl p-3.5 border transition-all hover:border-primary-500/40 ${
                selected?.id === a.id ? 'border-primary-500 bg-primary-500/10' : 'border-transparent'
              }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm leading-snug truncate">{a.title}</p>
                  <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {a.course_title}
                  </span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={ev => { ev.stopPropagation(); openEdit(a) }}
                    className="text-xs text-primary-400 border border-primary-500/30 px-1.5 py-1 rounded-lg hover:bg-primary-500/10">✏️</button>
                  <button onClick={ev => { ev.stopPropagation(); handleDelete(a.id) }}
                    className="text-xs text-red-400 border border-red-500/30 px-1.5 py-1 rounded-lg hover:bg-red-500/10">✕</button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                {a.deadline && <span>📅 {fmtDate(a.deadline)}</span>}
                <span>📨 {a.submission_count || 0} topshirilgan</span>
              </div>
            </button>
          ))}
        </div>

        {/* RIGHT — submissions */}
        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="flex flex-col items-center justify-center py-20">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-400 font-semibold">Topshiriqni tanlang</p>
              <p className="text-gray-600 text-sm mt-1">Chapdan topshiriqqa bosing</p>
            </Card>
          ) : subLoading ? (
            <Card className="flex justify-center py-20"><Spinner size="lg"/></Card>
          ) : (
            <div className="space-y-4">
              {/* Assignment info */}
              <Card>
                <h2 className="font-bold text-white text-base mb-1">{selected.title}</h2>
                {selected.description && <p className="text-sm text-gray-400 mb-3">{selected.description}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">{selected.course_title}</span>
                  {selected.deadline && <span>📅 Muddat: {fmtDate(selected.deadline)}</span>}
                  <span>🕐 Yaratilgan: {fmtDate(selected.created_at)}</span>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass rounded-xl p-3 text-center border border-yellow-500/20">
                  <p className="text-xl font-bold text-yellow-400">{pending}</p>
                  <p className="text-xs text-gray-400 mt-1">Tekshirilmoqda</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-green-500/20">
                  <p className="text-xl font-bold text-green-400">{graded}</p>
                  <p className="text-xs text-gray-400 mt-1">Baholangan</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-surface-border">
                  <p className="text-xl font-bold text-gray-400">{notSubmitted}</p>
                  <p className="text-xs text-gray-400 mt-1">Topshirilmagan</p>
                </div>
              </div>

              {/* Submissions list */}
              <Card>
                <p className="text-sm font-semibold text-white mb-3">O'quvchilar javobi</p>
                {submissions.length === 0 ? (
                  <EmptyState icon="🎒" title="Hali topshiriqlar yo'q"/>
                ) : (
                  <div className="space-y-2">
                    {submissions.map(s => {
                      const ss = SUB_STATUS[s.status] || SUB_STATUS.not_submitted
                      return (
                        <div key={s.student_id} className="p-3 rounded-xl border border-surface-border bg-surface-hover space-y-2">
                          <div className="flex items-center gap-3">
                            <Avatar name={s.firstName} size="sm"/>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{s.firstName}</p>
                              <p className="text-xs text-gray-500">{s.email}</p>
                            </div>
                            <Badge color={ss.color}>{ss.label}</Badge>
                            {s.status === 'graded' && s.grade != null && (
                              <span className={`text-base font-extrabold ${gradeColor(s.grade)}`}>{s.grade}</span>
                            )}
                          </div>
                          {s.content && (
                            <div className="bg-surface-card rounded-lg p-2.5 text-xs text-gray-300 border border-surface-border">
                              {s.content}
                            </div>
                          )}
                          {s.file_url && (
                            <a href={s.file_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs text-primary-400 border border-primary-500/30 px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all">
                              📎 Fayl yuklab olish
                            </a>
                          )}
                          {s.feedback && (
                            <div className="bg-primary-500/10 rounded-lg p-2 text-xs text-primary-300 border border-primary-500/20">
                              💬 {s.feedback}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            {s.submitted_at
                              ? <span className="text-xs text-gray-600">📩 {fmtDateTime(s.submitted_at)}</span>
                              : <span className="text-xs text-gray-600">—</span>
                            }
                            {s.status !== 'not_submitted' && (
                              <button onClick={() => { setGradeModal(s); setGradeForm({ grade: s.grade ?? '', feedback: s.feedback ?? '' }) }}
                                className="text-xs text-primary-400 border border-primary-500/30 px-2.5 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all">
                                {s.status === 'graded' ? '✏️ Baho o\'zgartirish' : '⭐ Baholash'}
                              </button>
                            )}
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

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Yangi topshiriq">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Kurs</label>
            <select className="input-field" required value={form.course_id}
              onChange={e => setForm({...form, course_id: e.target.value})}>
              <option value="">— Kurs tanlang —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <Input label="Topshiriq sarlavhasi" required value={form.title}
            onChange={e => setForm({...form, title: e.target.value})} placeholder="1-laboratoriya ishi"/>
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Tavsif</label>
            <textarea rows={3} className="input-field resize-none" value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Topshiriq haqida batafsil ma'lumot..."/>
          </div>
          <Input label="Muddat (sana)" type="date" value={form.deadline}
            onChange={e => setForm({...form, deadline: e.target.value})}/>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="flex-1">💾 Saqlash</Button>
            <Button type="button" variant="secondary" onClick={() => setCreateModal(false)} className="flex-1">Bekor</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Topshiriqni tahrirlash">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Kurs</label>
            <select className="input-field" required value={form.course_id}
              onChange={e => setForm({...form, course_id: e.target.value})}>
              <option value="">— Kurs tanlang —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <Input label="Sarlavha" required value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}/>
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Tavsif</label>
            <textarea rows={3} className="input-field resize-none" value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}/>
          </div>
          <Input label="Muddat" type="date" value={form.deadline}
            onChange={e => setForm({...form, deadline: e.target.value})}/>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="flex-1">💾 Saqlash</Button>
            <Button type="button" variant="secondary" onClick={() => setEditModal(null)} className="flex-1">Bekor</Button>
          </div>
        </form>
      </Modal>

      {/* Grade modal */}
      <Modal open={!!gradeModal} onClose={() => setGradeModal(null)} title="Topshiriqni baholash">
        {gradeModal && (
          <form onSubmit={handleGrade} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl">
              <Avatar name={gradeModal.firstName} size="md"/>
              <div>
                <p className="font-semibold text-white">{gradeModal.firstName}</p>
                <p className="text-xs text-gray-400">{gradeModal.email}</p>
              </div>
            </div>
            {(gradeModal.content || gradeModal.file_url) && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">O'quvchi javobi:</p>
                {gradeModal.content && (
                  <div className="bg-surface-card rounded-lg p-3 text-sm text-gray-300 border border-surface-border max-h-32 overflow-y-auto mb-2">
                    {gradeModal.content}
                  </div>
                )}
                {gradeModal.file_url && (
                  <a href={gradeModal.file_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary-400 border border-primary-500/30 px-3 py-2 rounded-lg hover:bg-primary-500/10 transition-all">
                    📎 Fayl yuklab olish
                  </a>
                )}
              </div>
            )}
            <Input label="Baho (0–100)" type="number" required min="0" max="100"
              value={gradeForm.grade} onChange={e => setGradeForm({...gradeForm, grade: e.target.value})}
              placeholder="85"/>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Izoh / Feedback</label>
              <textarea rows={3} className="input-field resize-none" value={gradeForm.feedback}
                onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})}
                placeholder="O'quvchiga izoh yozing..."/>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving} className="flex-1">⭐ Baholash</Button>
              <Button type="button" variant="secondary" onClick={() => setGradeModal(null)} className="flex-1">Bekor</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { coursesAPI, applicationsAPI, usersAPI } from '../../services/api'
import { Card, Button, Badge, Modal, Input, PageHeader, Spinner, EmptyState, StatCard, Avatar } from '../../components/ui'
import toast from 'react-hot-toast'

const CATS = ['IT', 'Til', 'Dizayn', 'Fan', 'Marketing']
const CAT_ICONS  = { IT:'💻', Til:'🌍', Dizayn:'🎨', Fan:'🔬', Marketing:'📢' }
const CAT_COLORS = { IT:'purple', Til:'blue', Dizayn:'green', Fan:'yellow', Marketing:'red' }

const EMPTY_FORM = {
  title:'', category:'IT', center:'', duration:'', day:'', time:'',
  price:'', students:'0 talaba', description:'', rating:'5.0',
  teacher_app_id: '', teacher_user_id: '',
}

export default function AdminCourses() {
  const [courses,     setCourses]     = useState([])
  const [acceptedApps,  setAcceptedApps]  = useState([])
  const [teacherUsers,  setTeacherUsers]  = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [catFilter,     setCatFilter]     = useState('all')
  const [modal,         setModal]         = useState(null) // 'form' | 'teacher'
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [editId,        setEditId]        = useState(null)
  const [teacherSearch, setTeacherSearch] = useState('')

  useEffect(() => { load(); loadApps(); loadTeacherUsers() }, [])

  async function load() {
    try { const { data } = await coursesAPI.list(); setCourses(data) }
    catch { toast.error('Kurslarni yuklashda xatolik') }
    finally { setLoading(false) }
  }

  async function loadApps() {
    try {
      const { data } = await applicationsAPI.list({ status: 'accepted' })
      setAcceptedApps(data || [])
    } catch {}
  }

  async function loadTeacherUsers() {
    try {
      const { data } = await usersAPI.list({ role: 'teacher' })
      setTeacherUsers(data || [])
    } catch {}
  }

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setTeacherSearch(''); setModal('form') }
  function openEdit(c)  { setEditId(c.id); setForm({ ...c, teacher_app_id: c.teacher_app_id || '', teacher_user_id: c.teacher_user_id || '' }); setTeacherSearch(''); setModal('form') }

  async function handleSave(e) {
    e.preventDefault()
    try {
      const payload = { ...form, teacher_app_id: form.teacher_app_id || null, teacher_user_id: form.teacher_user_id || null }
      if (editId) await coursesAPI.update(editId, payload)
      else await coursesAPI.create(payload)
      toast.success(editId ? 'Kurs yangilandi' : "Kurs qo'shildi")
      await load(); setModal(null)
    } catch { toast.error('Xatolik yuz berdi') }
  }

  async function handleDelete(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return
    try { await coursesAPI.delete(id); setCourses(c => c.filter(x => x.id !== id)); toast.success("O'chirildi") }
    catch { toast.error('Xatolik') }
  }

  function assignTeacher(app) {
    setForm(f => ({ ...f, teacher_app_id: app.id, teacher_name: app.name, teacher_subject: app.subject }))
    setModal('form')
  }

  function removeTeacher() {
    setForm(f => ({ ...f, teacher_app_id: '', teacher_name: '', teacher_subject: '' }))
  }

  const filtered = courses.filter(c => {
    const s = search.toLowerCase()
    return (catFilter === 'all' || c.category === catFilter) &&
      (c.title?.toLowerCase().includes(s) || c.center?.toLowerCase().includes(s))
  })

  const filteredApps = acceptedApps.filter(a =>
    a.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    a.subject.toLowerCase().includes(teacherSearch.toLowerCase())
  )

  const fmt = n => new Intl.NumberFormat('uz-UZ').format(n)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Kurslar boshqaruvi" subtitle={`Jami: ${courses.length} ta kurs`}
        action={<Button icon="➕" onClick={openCreate}>Yangi kurs</Button>}/>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Jami kurslar"  value={courses.length}                                    icon="📚" color="purple"/>
        <StatCard title="O'qituvchi bor" value={courses.filter(c=>c.teacher_app_id).length}       icon="👨‍🏫" color="green"/>
        <StatCard title="IT kurslar"    value={courses.filter(c=>c.category==='IT').length}       icon="💻" color="blue"/>
        <StatCard title="Til kurslari"  value={courses.filter(c=>c.category==='Til').length}      icon="🌍" color="yellow"/>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Kurs nomi yoki markaz..."
              className="input-field pl-10"/>
          </div>
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="input-field w-40">
            <option value="all">Barchasi</option>
            {CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filtered.length===0 ? <EmptyState icon="📚" title="Kurs topilmadi"/> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(c=>(
              <div key={c.id} className="glass glass-hover rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CAT_ICONS[c.category]||'📚'}</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm leading-tight">{c.title}</h4>
                      <p className="text-xs text-gray-500">{c.center}</p>
                    </div>
                  </div>
                  <Badge color={CAT_COLORS[c.category]||'gray'}>{c.category}</Badge>
                </div>

                {/* Teacher row */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                  c.teacher_name ? 'bg-green-500/10 border border-green-500/20' : 'bg-surface-hover border border-surface-border'
                }`}>
                  <span>{c.teacher_name ? '👨‍🏫' : '➕'}</span>
                  <span className={c.teacher_name ? 'text-green-300 font-semibold' : 'text-gray-500'}>
                    {c.teacher_name || "O'qituvchi belgilanmagan"}
                  </span>
                  {c.teacher_subject && <span className="text-gray-500 ml-auto">{c.teacher_subject.split('/')[0]?.trim()}</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-hover rounded-lg px-2 py-1.5">
                    <span className="text-gray-500">Davomiyligi</span>
                    <p className="text-gray-200 font-medium">{c.duration||'—'}</p>
                  </div>
                  <div className="bg-surface-hover rounded-lg px-2 py-1.5">
                    <span className="text-gray-500">Narx</span>
                    <p className="text-primary-400 font-medium">{fmt(c.price)}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={()=>openEdit(c)} className="flex-1">✏️ Tahrir</Button>
                  <Button size="sm" variant="danger" onClick={()=>handleDelete(c.id)}>🗑️</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Form modal */}
      <Modal open={modal==='form'} onClose={()=>setModal(null)} title={editId?'Kursni tahrirlash':'Yangi kurs'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Kurs nomi" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Kurs nomi"/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Kategoriya</label>
              <select className="input-field" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Markaz" required value={form.center} onChange={e=>setForm({...form,center:e.target.value})} placeholder="IT Academy"/>
            <Input label="Davomiyligi" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} placeholder="4 oy"/>
            <Input label="Narx (so'm)" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="1200000"/>
            <Input label="Kunlar" value={form.day} onChange={e=>setForm({...form,day:e.target.value})} placeholder="Dushanba, Chorshanba"/>
            <Input label="Vaqt" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} placeholder="14:00"/>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Tavsif</label>
              <textarea className="input-field resize-none" rows={2} value={form.description}
                onChange={e=>setForm({...form,description:e.target.value})} placeholder="Kurs haqida..."/>
            </div>
          </div>

          {/* Teacher assignment block */}
          <div className="border-t border-surface-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">👨‍🏫 O'qituvchi belgilash</p>
              {form.teacher_app_id && (
                <button type="button" onClick={removeTeacher}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  ✕ O'chirish
                </button>
              )}
            </div>

            {form.teacher_name ? (
              /* Currently assigned teacher */
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl mb-3">
                <Avatar name={form.teacher_name} size="sm"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-300">{form.teacher_name}</p>
                  <p className="text-xs text-gray-400">{form.teacher_subject}</p>
                </div>
                <Badge color="green">Belgilangan</Badge>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-3">Hozirda o'qituvchi belgilanmagan</p>
            )}

            <button type="button" onClick={()=>setModal('teacher')}
              className="w-full py-2.5 rounded-xl border border-dashed border-primary-500/40 text-primary-400 hover:bg-primary-500/10 text-sm font-semibold transition-all">
              🔍 Qabul qilingan arizalardan tanlash ({acceptedApps.length} ta)
            </button>
          </div>

          {/* Teacher user account link */}
          <div className="border-t border-surface-border pt-4">
            <p className="text-sm font-semibold text-white mb-2">🔑 O'qituvchi foydalanuvchi hisobi</p>
            <p className="text-xs text-gray-500 mb-2">O'qituvchi o'z panelida shu kursni ko'rishi uchun hisob tanlang</p>
            <select className="input-field" value={form.teacher_user_id}
              onChange={e => setForm({...form, teacher_user_id: e.target.value})}>
              <option value="">— Tanlang —</option>
              {teacherUsers.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">💾 Saqlash</Button>
            <Button type="button" variant="secondary" onClick={()=>setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </form>
      </Modal>

      {/* Teacher picker modal */}
      <Modal open={modal==='teacher'} onClose={()=>setModal('form')} title="O'qituvchi tanlash (qabul qilingan arizalar)" size="lg">
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input value={teacherSearch} onChange={e=>setTeacherSearch(e.target.value)}
              placeholder="Ism yoki yo'nalish bo'yicha qidirish..."
              className="input-field pl-10"/>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredApps.length===0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">Topilmadi</p>
              </div>
            ) : filteredApps.map(a=>(
              <button key={a.id} type="button" onClick={()=>assignTeacher(a)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  Number(form.teacher_app_id)===a.id
                    ? 'bg-primary-500/20 border-primary-500/50'
                    : 'bg-surface-hover border-surface-border hover:border-primary-500/30'
                }`}>
                <Avatar name={a.name} size="sm"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.subject} · {a.experience}</p>
                  {a.phone && <p className="text-xs text-gray-500">{a.phone}</p>}
                </div>
                {Number(form.teacher_app_id)===a.id && (
                  <span className="text-green-400 text-lg flex-shrink-0">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2 border-t border-surface-border">
            <Button onClick={()=>setModal('form')} className="flex-1">✅ Tasdiqlash</Button>
            <Button variant="secondary" onClick={()=>{removeTeacher();setModal('form')}} className="flex-1">O'chirish</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

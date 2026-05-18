import { useState, useEffect } from 'react'
import { coursesAPI, coursePaymentsAPI, paymentsAPI } from '../../services/api'
import { Card, Button, Badge, Avatar, Modal, Input, PageHeader, Spinner, EmptyState } from '../../components/ui'
import toast from 'react-hot-toast'

const PAY_STATUS = {
  paid:    { label: "To'ladi",    color: 'green',  bg: 'bg-green-500/10 border-green-500/20'   },
  pending: { label: 'Kutilmoqda', color: 'yellow', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  unpaid:  { label: 'Qarzdor',    color: 'red',    bg: 'bg-red-500/10 border-red-500/20'       },
}

const METHODS = [
  { value: 'Naqd',  label: '💵 Naqd'  },
  { value: 'Karta', label: '💳 Karta' },
  { value: 'Payme', label: '📱 Payme' },
  { value: 'Click', label: '📲 Click' },
]

const fmt = n => new Intl.NumberFormat('uz-UZ').format(n || 0)
const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

export default function ManagerPayments() {
  const [courses,  setCourses]  = useState([])
  const [selected, setSelected] = useState(null)
  const [detail,   setDetail]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search,   setSearch]   = useState('')

  const [payModal, setPayModal] = useState(null) // student object
  const [payForm,  setPayForm]  = useState({ amount: '', method: 'Naqd', status: 'paid' })
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    coursesAPI.list().then(r => setCourses(r.data)).catch(() => []).finally(() => setLoading(false))
  }, [])

  async function selectCourse(c) {
    setSelected(c); setDetail(null); setDetailLoading(true)
    try { const r = await coursePaymentsAPI.get(c.id); setDetail(r.data) }
    catch { setDetail(null) }
    finally { setDetailLoading(false) }
  }

  async function refreshDetail() {
    if (!selected) return
    try { const r = await coursePaymentsAPI.get(selected.id); setDetail(r.data) }
    catch {}
  }

  function openPayModal(s) {
    setPayModal(s)
    setPayForm({
      amount: s.amount > 0 ? String(s.amount) : String(detail?.course?.price || ''),
      method: 'Naqd',
      status: 'paid',
    })
  }

  async function handlePay(e) {
    e.preventDefault(); setSaving(true)
    try {
      if (payModal.payment_id) {
        await paymentsAPI.update(payModal.payment_id, {
          amount: Number(payForm.amount),
          method: payForm.method,
          status: payForm.status,
        })
      } else {
        await paymentsAPI.create({
          user_id:   payModal.id,
          course_id: selected.id,
          amount:    Number(payForm.amount),
          method:    payForm.method,
          status:    payForm.status,
        })
      }
      toast.success("To'lov saqlandi")
      await refreshDetail(); setPayModal(null)
    } catch { toast.error('Xatolik') }
    finally { setSaving(false) }
  }

  const filteredCourses = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  )

  const students = detail?.students || []
  const paidCount    = students.filter(s => s.payment_status === 'paid').length
  const pendingCount = students.filter(s => s.payment_status === 'pending').length
  const unpaidCount  = students.filter(s => s.payment_status === 'unpaid').length
  const totalRevenue = students.filter(s => s.payment_status === 'paid').reduce((sum, s) => sum + (s.amount || 0), 0)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="To'lovlar" subtitle={`${courses.length} ta kurs — kursni tanlang`}/>

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
                  {c.price > 0 && <span className="text-primary-400 font-medium">{fmt(c.price)} so'm</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="flex flex-col items-center justify-center py-20">
              <div className="text-5xl mb-3">💳</div>
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
                    <h2 className="font-bold text-white text-base">{detail.course?.title}</h2>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                      <span>📂 {detail.course?.category}</span>
                      <span className="text-primary-400 font-bold">{fmt(detail.course?.price)} so'm/oy</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="glass rounded-xl p-3 text-center border border-surface-border">
                  <p className="text-xl font-bold text-white">{students.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Jami</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-green-500/20">
                  <p className="text-xl font-bold text-green-400">{paidCount}</p>
                  <p className="text-xs text-gray-400 mt-1">To'ladi</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-yellow-500/20">
                  <p className="text-xl font-bold text-yellow-400">{pendingCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Kutilmoqda</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-red-500/20">
                  <p className="text-xl font-bold text-red-400">{unpaidCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Qarzdor</p>
                </div>
              </div>

              {/* Revenue */}
              <div className="glass rounded-xl p-4 border border-green-500/20 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-xs text-gray-400">Ushbu kursdan tushum</p>
                  <p className="text-lg font-bold text-green-400">{fmt(totalRevenue)} so'm</p>
                </div>
              </div>

              {/* Students */}
              <Card>
                <p className="text-sm font-semibold text-white mb-4">O'quvchilar to'lov holati</p>
                {students.length === 0 ? (
                  <EmptyState icon="🎒" title="Hali o'quvchi yo'q"/>
                ) : (
                  <div className="space-y-2">
                    {students.map(s => {
                      const ps = PAY_STATUS[s.payment_status] || PAY_STATUS.unpaid
                      return (
                        <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${ps.bg}`}>
                          <Avatar name={s.firstName} size="sm"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{s.firstName}</p>
                            <p className="text-xs text-gray-500 truncate">{s.email}</p>
                          </div>
                          <div className="hidden sm:block text-right flex-shrink-0">
                            {s.amount > 0 && (
                              <p className="text-xs font-semibold text-green-400">{fmt(s.amount)} so'm</p>
                            )}
                            <p className="text-xs text-gray-600">{fmtDate(s.enrolled_at)}</p>
                          </div>
                          <Badge color={ps.color}>{ps.label}</Badge>
                          <button onClick={() => openPayModal(s)}
                            className="text-xs text-primary-400 border border-primary-500/30 px-2.5 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all flex-shrink-0 whitespace-nowrap">
                            💳 To'lov
                          </button>
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

      {/* Payment modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="To'lov qabul qilish">
        {payModal && (
          <form onSubmit={handlePay} className="space-y-4">
            {/* Student info (readonly) */}
            <div className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl">
              <Avatar name={payModal.firstName} size="md"/>
              <div>
                <p className="font-semibold text-white">{payModal.firstName}</p>
                <p className="text-xs text-gray-400">{payModal.email}</p>
              </div>
              <Badge color={(PAY_STATUS[payModal.payment_status] || PAY_STATUS.unpaid).color} className="ml-auto">
                {(PAY_STATUS[payModal.payment_status] || PAY_STATUS.unpaid).label}
              </Badge>
            </div>

            <div className="p-3 bg-surface-hover rounded-xl text-sm">
              <span className="text-gray-400">Kurs: </span>
              <span className="text-white font-medium">{detail?.course?.title}</span>
              {detail?.course?.price > 0 && (
                <span className="text-primary-400 ml-2 font-semibold">{fmt(detail.course.price)} so'm</span>
              )}
            </div>

            <Input label="To'lov miqdori (so'm)" type="number" required
              value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})}
              placeholder="1200000"/>

            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">To'lov usuli</label>
              <div className="grid grid-cols-4 gap-2">
                {METHODS.map(m => (
                  <button key={m.value} type="button"
                    onClick={() => setPayForm({...payForm, method: m.value})}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                      payForm.method === m.value
                        ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                        : 'border-surface-border text-gray-400 hover:border-gray-600'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Holat</label>
              <div className="grid grid-cols-2 gap-2">
                {[['paid', "✅ To'langan", 'green'], ['pending', '⏳ Kutilmoqda', 'yellow']].map(([v, l, c]) => (
                  <button key={v} type="button"
                    onClick={() => setPayForm({...payForm, status: v})}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      payForm.status === v
                        ? c === 'green'
                          ? 'border-green-500 bg-green-500/20 text-green-300'
                          : 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                        : 'border-surface-border text-gray-400 hover:border-gray-600'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving} className="flex-1">💾 Saqlash</Button>
              <Button type="button" variant="secondary" onClick={() => setPayModal(null)} className="flex-1">Bekor</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { coursesAPI, coursePaymentsAPI, paymentsAPI } from '../../services/api'
import { Card, PageHeader, Badge, Button, Modal, Spinner, EmptyState, Avatar } from '../../components/ui'

function fmtPrice(n) { return new Intl.NumberFormat('uz-UZ').format(n || 0) + " so'm" }
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const PAY_STATUS = {
  paid:    { label: "To'ladi",    color: 'green' },
  pending: { label: 'Kutilmoqda', color: 'yellow' },
  unpaid:  { label: 'Qarzdor',    color: 'red' },
}

export default function AdminPayments() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [payModal, setPayModal] = useState(null)
  const [payForm, setPayForm] = useState({ amount: '', status: 'paid', method: 'Naqd' })
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    coursesAPI.list()
      .then(r => setCourses(r.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setDetailLoading(true)
    coursePaymentsAPI.get(selected.id)
      .then(r => setDetail(r.data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false))
  }, [selected])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function savePayment(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const student = payModal
      if (student.payment_id) {
        await paymentsAPI.update(student.payment_id, { status: payForm.status, amount: payForm.amount })
      } else {
        await paymentsAPI.create({
          user_id: student.id,
          course_id: selected.id,
          amount: payForm.amount,
          status: payForm.status,
          method: payForm.method,
        })
      }
      // refresh detail
      const r = await coursePaymentsAPI.get(selected.id)
      setDetail(r.data)
      setPayModal(null)
      showToast("✅ To'lov muvaffaqiyatli saqlandi")
    } catch {
      showToast('❌ Xatolik yuz berdi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const paidCount = detail?.students?.filter(s => s.payment_status === 'paid').length || 0
  const unpaidCount = detail?.students?.filter(s => s.payment_status !== 'paid').length || 0
  const totalRevenue = detail?.students?.reduce((sum, s) => sum + (s.payment_status === 'paid' ? s.amount : 0), 0) || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold animate-fade-in ${
          toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'
        }`}>{toast.msg}</div>
      )}

      <PageHeader title="To'lovlar boshqaruvi" subtitle="Kursni tanlang — o'qituvchi va to'lov holati ko'rinadi"/>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 h-full">
        {/* LEFT — courses list */}
        <div className="lg:col-span-2 space-y-3">
          <input
            placeholder="🔍 Kurs qidirish..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field w-full text-sm"/>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner/></div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredCourses.map(c => (
                <button key={c.id} onClick={() => setSelected(c)}
                  className={`w-full text-left glass rounded-xl p-4 transition-all hover:border-primary-500/40 border ${
                    selected?.id === c.id
                      ? 'border-primary-500 bg-primary-500/10 shadow-glow'
                      : 'border-transparent'
                  }`}>
                  <div className="font-semibold text-white text-sm leading-snug mb-1">{c.title}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <span className="bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full font-semibold">{c.category}</span>
                    <span>👥 {c.students}</span>
                  </div>
                  {c.teacher_name ? (
                    <div className="text-xs text-green-400 mb-1">👨‍🏫 {c.teacher_name}</div>
                  ) : (
                    <div className="text-xs text-gray-600 mb-1">👨‍🏫 O'qituvchi yo'q</div>
                  )}
                  <div className="text-xs text-primary-400 font-bold">{fmtPrice(c.price)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — course detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="flex flex-col items-center justify-center py-20">
              <div className="text-5xl mb-4">💳</div>
              <p className="text-gray-400 font-semibold">Kursni tanlang</p>
              <p className="text-gray-600 text-sm mt-1">Chap tomonda kursni bosing</p>
            </Card>
          ) : detailLoading ? (
            <Card className="flex justify-center py-20"><Spinner size="lg"/></Card>
          ) : !detail ? (
            <Card><EmptyState icon="⚠️" title="Ma'lumot yuklanmadi"/></Card>
          ) : (
            <div className="space-y-4">
              {/* Course header */}
              <Card>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📚</div>
                  <div className="flex-1">
                    <h2 className="font-bold text-white text-lg leading-snug">{detail.course?.title}</h2>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                      <span>📂 {detail.course?.category}</span>
                      <span>🏛 {detail.course?.center}</span>
                      <span>⏱ {detail.course?.duration}</span>
                      <span className="text-primary-400 font-bold">{fmtPrice(detail.course?.price)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Teacher card */}
              <Card>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">👨‍🏫 O'qituvchi</p>
                {detail.teacher ? (
                  <div className="flex items-center gap-3">
                    <Avatar name={detail.teacher.name} size="lg"/>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{detail.teacher.name}</p>
                      <p className="text-xs text-primary-400">{detail.teacher.subject}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        {detail.teacher.experience && <span>⏱ {detail.teacher.experience}</span>}
                        {detail.teacher.phone && <span>📞 {detail.teacher.phone}</span>}
                        {detail.teacher.email && <span>✉️ {detail.teacher.email}</span>}
                      </div>
                    </div>
                    <Badge color="green">Belgilangan</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-2 text-gray-500 text-sm">
                    <span className="text-2xl">➕</span>
                    <span>O'qituvchi belgilanmagan. Kurslar bo'limidan biriktiring.</span>
                  </div>
                )}
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass rounded-xl p-3 text-center border border-surface-border">
                  <p className="text-2xl font-bold text-white">{detail.students?.length || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Jami o'quvchi</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-green-500/20">
                  <p className="text-2xl font-bold text-green-400">{paidCount}</p>
                  <p className="text-xs text-gray-400 mt-1">To'ladi</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-red-500/20">
                  <p className="text-2xl font-bold text-red-400">{unpaidCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Qarzdor</p>
                </div>
              </div>

              <div className="glass rounded-xl p-3 border border-yellow-500/20 text-center">
                <p className="text-xs text-gray-500 mb-1">Jami tushum</p>
                <p className="text-xl font-bold text-yellow-400">{fmtPrice(totalRevenue)}</p>
              </div>

              {/* Students table */}
              {detail.students?.length === 0 ? (
                <Card><EmptyState icon="🎒" title="Bu kursga hali hech kim yozilmagan"/></Card>
              ) : (
                <Card>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-4">O'quvchilar ro'yxati</p>
                  <div className="space-y-2">
                    {detail.students.map(s => {
                      const ps = PAY_STATUS[s.payment_status] || PAY_STATUS.unpaid
                      return (
                        <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-surface-border last:border-0">
                          <Avatar name={s.firstName} size="sm"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{s.firstName}</p>
                            <p className="text-xs text-gray-500 truncate">{s.email}</p>
                          </div>
                          <div className="text-center flex-shrink-0 hidden sm:block">
                            <p className="text-xs text-gray-400">Yozilgan</p>
                            <p className="text-xs text-gray-300">{fmtDate(s.enrolled_at)}</p>
                          </div>
                          {s.payment_status === 'paid' && (
                            <div className="text-center flex-shrink-0">
                              <p className="text-xs font-bold text-green-400">{fmtPrice(s.amount)}</p>
                            </div>
                          )}
                          <Badge color={ps.color}>{ps.label}</Badge>
                          <button
                            onClick={() => { setPayModal(s); setPayForm({ amount: s.amount || detail.course?.price || '', status: s.payment_status === 'unpaid' ? 'paid' : s.payment_status, method: 'Naqd' }) }}
                            className="text-xs text-primary-400 hover:text-primary-300 border border-primary-500/30 px-2.5 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all flex-shrink-0">
                            ✏️
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="To'lovni belgilash">
        {payModal && (
          <form onSubmit={savePayment} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl">
              <Avatar name={payModal.firstName} size="md"/>
              <div>
                <p className="font-semibold text-white">{payModal.firstName}</p>
                <p className="text-xs text-gray-400">{payModal.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">To'lov holati</label>
              <select value={payForm.status} onChange={e => setPayForm({ ...payForm, status: e.target.value })} className="input-field w-full">
                <option value="paid">To'ladi</option>
                <option value="pending">Kutilmoqda</option>
                <option value="unpaid">Qarzdor</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Miqdor (so'm)</label>
              <input type="number" required value={payForm.amount}
                onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                placeholder={fmtPrice(detail?.course?.price)}
                className="input-field w-full"/>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">To'lov usuli</label>
              <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })} className="input-field w-full">
                <option value="Naqd">Naqd</option>
                <option value="Karta">Karta</option>
                <option value="Payme">Payme</option>
                <option value="Click">Click</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving} className="flex-1">💾 Saqlash</Button>
              <Button variant="secondary" type="button" onClick={() => setPayModal(null)}>Bekor</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { paymentsAPI } from '../../services/api'
import { Card, Badge, PageHeader, Spinner, EmptyState } from '../../components/ui'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(n || 0)
const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

const METHOD_ICON = { Naqd:'💵', Karta:'💳', Payme:'🟠', Click:'🔵', cash:'💵', card:'💳' }

const STATUS = {
  paid:    { label: "To'landi",   color: 'green',  icon: '✅', bg: 'bg-green-500/10 border-green-500/20'   },
  pending: { label: 'Kutilmoqda', color: 'yellow', icon: '⏳', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  unpaid:  { label: 'Qarzdor',    color: 'red',    icon: '❗', bg: 'bg-red-500/10 border-red-500/20'       },
}

export default function StudentPayments() {
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    paymentsAPI.list()
      .then(r => setPayments(r.data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)

  const tolandi    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0)
  const kutilmoqda = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0)
  const jami       = payments.reduce((s, p) => s + (p.amount || 0), 0)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="To'lovlarim" subtitle={`Jami ${payments.length} ta to'lov`}/>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 border border-green-500/20 text-center">
          <p className="text-xl font-bold text-green-400">{fmt(tolandi)}</p>
          <p className="text-xs text-gray-500 mt-0.5">so'm · To'landi</p>
        </div>
        <div className="glass rounded-xl p-4 border border-yellow-500/20 text-center">
          <p className="text-xl font-bold text-yellow-400">{fmt(kutilmoqda)}</p>
          <p className="text-xs text-gray-500 mt-0.5">so'm · Kutilmoqda</p>
        </div>
        <div className="glass rounded-xl p-4 border border-surface-border text-center">
          <p className="text-xl font-bold text-white">{fmt(jami)}</p>
          <p className="text-xs text-gray-500 mt-0.5">so'm · Jami</p>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-white">To'lovlar tarixi</h3>
          <div className="flex gap-1.5 flex-wrap">
            {[['all','Barchasi'],['paid',"To'landi"],['pending','Kutilmoqda']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === v ? 'bg-primary-500 text-white shadow-glow' : 'bg-surface-hover text-gray-400 hover:text-white border border-surface-border'
                }`}>{l}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="💳" title="To'lovlar topilmadi"/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-3 px-3 text-xs text-gray-500 font-semibold uppercase">№</th>
                  <th className="text-left py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Kurs</th>
                  <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold">Miqdor</th>
                  <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold">Usul</th>
                  <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold">Sana</th>
                  <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold">Holat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const st = STATUS[p.status] || STATUS.unpaid
                  const icon = METHOD_ICON[p.method] || '💳'
                  return (
                    <tr key={p.id} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                      <td className="py-3 px-3 text-gray-600 text-xs">{i+1}</td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-white text-sm">{p.course_title || 'Kurs'}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-white">{fmt(p.amount)}</span>
                        <span className="text-xs text-gray-500 ml-1">so'm</span>
                      </td>
                      <td className="py-3 px-3 text-center text-sm">
                        {icon} <span className="text-xs text-gray-400">{p.method}</span>
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-gray-400">{fmtDate(p.created_at)}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge color={st.color}>{st.icon} {st.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-surface-border bg-surface-hover">
                  <td colSpan={2} className="py-3 px-3 text-sm font-bold text-white">Jami</td>
                  <td className="py-3 px-3 text-center text-sm font-extrabold text-white">
                    {fmt(filtered.reduce((s,p) => s+(p.amount||0), 0))} so'm
                  </td>
                  <td colSpan={3}/>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

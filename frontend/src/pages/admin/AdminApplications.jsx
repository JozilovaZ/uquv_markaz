import { useState, useEffect } from 'react'
import { applicationsAPI } from '../../services/api'
import { Card, PageHeader, Badge, Button, Modal, Spinner, EmptyState, Avatar } from '../../components/ui'

const STATUS_MAP = {
  pending:  { label: 'Kutilmoqda', color: 'yellow' },
  accepted: { label: 'Qabul qilindi', color: 'green' },
  rejected: { label: 'Rad etildi', color: 'red' },
}

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    applicationsAPI.list()
      .then(r => setApps(r.data))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleStatus(app, status) {
    setProcessing(app.id)
    try {
      await applicationsAPI.updateStatus(app.id, status)
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status } : a))
      if (selected?.id === app.id) setSelected({ ...selected, status })
      if (status === 'accepted') {
        showToast(`✅ ${app.name} qabul qilindi! Email bildirish yuborildi.`, 'success')
      } else {
        showToast(`❌ ${app.name} arizasi rad etildi.`, 'error')
      }
    } catch {
      showToast('Xatolik yuz berdi', 'error')
    } finally {
      setProcessing(null)
    }
  }

  const FILTERS = [
    { id: 'all',      label: 'Barchasi', count: apps.length },
    { id: 'pending',  label: 'Kutilmoqda', count: apps.filter(a => a.status === 'pending').length },
    { id: 'accepted', label: 'Qabul', count: apps.filter(a => a.status === 'accepted').length },
    { id: 'rejected', label: 'Rad etilgan', count: apps.filter(a => a.status === 'rejected').length },
  ]

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold animate-fade-in ${
          toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <PageHeader
        title="O'qituvchi arizalari"
        subtitle={`Jami ${apps.length} ta ariza • ${apps.filter(a => a.status === 'pending').length} ta kutilmoqda`}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.id
                ? 'bg-primary-500 text-white shadow-glow'
                : 'glass text-gray-400 hover:text-white'
            }`}>
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              filter === f.id ? 'bg-white/20' : 'bg-surface-hover'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg"/></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📭" title="Ariza topilmadi" desc="Bu bo'limda hozircha ariza yo'q"/>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <Card key={app.id} className="cursor-pointer hover:border-primary-500/40 border border-transparent transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Avatar */}
                <Avatar name={app.name} size="lg"/>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-white">{app.name}</span>
                    <Badge color={STATUS_MAP[app.status]?.color || 'gray'}>
                      {STATUS_MAP[app.status]?.label || app.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400 mb-2">
                    <span>✉️ {app.email}</span>
                    {app.phone && <span>📞 {app.phone}</span>}
                    <span>📚 {app.subject}</span>
                    {app.experience && <span>⏱ {app.experience}</span>}
                    <span>🕐 {fmt(app.created_at)}</span>
                  </div>
                  {app.message && (
                    <p className="text-xs text-gray-400 bg-surface-hover rounded-lg px-3 py-2 italic line-clamp-2 mb-2">
                      "{app.message}"
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {app.cv_filename && (
                      <a href={`/media/cvs/${app.cv_filename}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-semibold border border-primary-500/30 px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all">
                        📄 CV / Rezyume ko'rish
                      </a>
                    )}
                    <button onClick={() => setSelected(app)}
                      className="text-xs text-gray-400 hover:text-white border border-surface-border px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-all">
                      Batafsil
                    </button>
                  </div>
                </div>

                {/* Actions */}
                {app.status === 'pending' && (
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    <Button variant="success" size="sm"
                      loading={processing === app.id}
                      onClick={() => handleStatus(app, 'accepted')}>
                      ✅ Qabul
                    </Button>
                    <Button variant="danger" size="sm"
                      loading={processing === app.id}
                      onClick={() => handleStatus(app, 'rejected')}>
                      ❌ Rad
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Ariza tafsilotlari" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-surface-hover rounded-xl">
              <Avatar name={selected.name} size="lg"/>
              <div>
                <h3 className="font-bold text-white text-lg">{selected.name}</h3>
                <Badge color={STATUS_MAP[selected.status]?.color || 'gray'}>
                  {STATUS_MAP[selected.status]?.label || selected.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['✉️ Email', selected.email],
                ['📞 Telefon', selected.phone || '—'],
                ['📚 Yo\'nalish', selected.subject],
                ['⏱ Tajriba', selected.experience || '—'],
                ['📅 Yuborilgan', fmt(selected.created_at)],
              ].map(([label, val]) => (
                <div key={label} className="bg-surface-hover rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">{label}</p>
                  <p className="text-gray-200 font-medium">{val}</p>
                </div>
              ))}
            </div>

            {selected.message && (
              <div className="bg-surface-hover rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">📝 O'zingiz haqida</p>
                <p className="text-gray-300 text-sm leading-relaxed">{selected.message}</p>
              </div>
            )}

            {selected.cv_filename && (
              <a href={`/media/cvs/${selected.cv_filename}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-primary-400 hover:text-primary-300 font-semibold text-sm border border-primary-500/30 px-4 py-3 rounded-xl hover:bg-primary-500/10 transition-all w-fit">
                📄 CV / Rezyumeni yuklab ko'rish
              </a>
            )}

            {selected.status === 'pending' && (
              <div className="flex gap-3 pt-2 border-t border-surface-border">
                <Button variant="success"
                  loading={processing === selected.id}
                  onClick={() => handleStatus(selected, 'accepted')}
                  className="flex-1">
                  ✅ Ishga qabul qilish (Email yuborish)
                </Button>
                <Button variant="danger"
                  loading={processing === selected.id}
                  onClick={() => handleStatus(selected, 'rejected')}
                  className="flex-1">
                  ❌ Rad etish
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

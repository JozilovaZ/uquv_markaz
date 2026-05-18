import { useState, useEffect } from 'react'
import { assignmentsAPI, submissionsAPI } from '../../services/api'
import { Card, Button, Badge, Modal, PageHeader, Spinner, EmptyState } from '../../components/ui'
import toast from 'react-hot-toast'

const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
const fmtDateTime = d => d ? new Date(d).toLocaleString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

function isOverdue(deadline) {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

function gradeColor(g) {
  if (g >= 86) return 'text-green-400'
  if (g >= 71) return 'text-blue-400'
  if (g >= 56) return 'text-yellow-400'
  return 'text-red-400'
}

function gradeLabel(g) {
  if (g >= 86) return 'A'
  if (g >= 71) return 'B'
  if (g >= 56) return 'C'
  if (g >= 41) return 'D'
  return 'F'
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [submitModal, setSubmitModal] = useState(null)
  const [content,     setContent]     = useState('')
  const [file,        setFile]        = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [filter,      setFilter]      = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    try { const r = await assignmentsAPI.list(); setAssignments(r.data) }
    catch { setAssignments([]) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() && !file) { toast.error("Javob yoki fayl kiriting"); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('assignment_id', submitModal.id)
      fd.append('content', content)
      if (file) fd.append('file', file)
      await submissionsAPI.submit(fd)
      toast.success('Topshiriq topshirildi')
      await load(); setSubmitModal(null); setContent(''); setFile(null)
    } catch { toast.error('Xatolik') }
    finally { setSaving(false) }
  }

  const filtered = filter === 'all' ? assignments :
    filter === 'not_submitted' ? assignments.filter(a => a.sub_status === 'not_submitted') :
    filter === 'pending'       ? assignments.filter(a => a.sub_status === 'pending') :
    filter === 'graded'        ? assignments.filter(a => a.sub_status === 'graded') : assignments

  const stats = {
    all:           assignments.length,
    not_submitted: assignments.filter(a => a.sub_status === 'not_submitted').length,
    pending:       assignments.filter(a => a.sub_status === 'pending').length,
    graded:        assignments.filter(a => a.sub_status === 'graded').length,
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Topshiriqlar" subtitle={`${assignments.length} ta topshiriq berilgan`}/>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key:'all',           icon:'📋', label:'Jami',          v:stats.all,           bc:'border-surface-border',  tc:'text-white'    },
          { key:'not_submitted', icon:'📭', label:'Topshirilmagan',v:stats.not_submitted, bc:'border-red-500/20',     tc:'text-red-400'  },
          { key:'pending',       icon:'⏳', label:'Tekshirilmoqda',v:stats.pending,       bc:'border-yellow-500/20',  tc:'text-yellow-400'},
          { key:'graded',        icon:'✅', label:'Baholangan',    v:stats.graded,        bc:'border-green-500/20',   tc:'text-green-400'},
        ].map(s => (
          <div key={s.key} className={`glass rounded-xl p-3 border ${s.bc} text-center`}>
            <p className="text-lg">{s.icon}</p>
            <p className={`text-xl font-bold ${s.tc}`}>{s.v}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['all','Barchasi'], ['not_submitted','Topshirilmagan'],
          ['pending','Tekshirilmoqda'], ['graded','Baholangan']
        ].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filter === v ? 'bg-primary-500 text-white shadow-glow' : 'bg-surface-hover text-gray-400 hover:text-white border border-surface-border'
            }`}>{l}</button>
        ))}
      </div>

      {/* Assignment cards */}
      {filtered.length === 0 ? (
        <Card><EmptyState icon="📝" title="Topshiriqlar topilmadi"/></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const overdue = isOverdue(a.deadline) && a.sub_status === 'not_submitted'
            return (
              <Card key={a.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📝</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-sm leading-snug">{a.title}</h3>
                      <StatusBadge status={a.sub_status} grade={a.grade}/>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-400">
                      <span className="bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">{a.course_title}</span>
                      {a.deadline && (
                        <span className={overdue ? 'text-red-400' : 'text-gray-400'}>
                          📅 {fmtDate(a.deadline)}{overdue ? ' — muddati o\'tgan!' : ''}
                        </span>
                      )}
                      <span>🕐 {fmtDate(a.created_at)}</span>
                    </div>
                    {a.description && <p className="text-xs text-gray-400 mt-2">{a.description}</p>}
                  </div>
                </div>

                {/* Submitted content */}
                {(a.sub_content || a.sub_file_url) && (
                  <div className="bg-surface-hover rounded-lg p-3 text-xs text-gray-300 border border-surface-border space-y-2">
                    <p className="text-gray-500">Mening javobim:</p>
                    {a.sub_content && <p>{a.sub_content}</p>}
                    {a.sub_file_url && (
                      <a href={a.sub_file_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary-400 hover:text-primary-300">
                        📎 Yuklangan fayl
                      </a>
                    )}
                  </div>
                )}

                {/* Teacher feedback */}
                {a.sub_status === 'graded' && (
                  <div className="bg-surface-hover rounded-xl p-4 border border-green-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 font-semibold">O'qituvchi bahosi</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-extrabold ${gradeColor(a.grade)}`}>{a.grade}</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg bg-surface-card ${gradeColor(a.grade)}`}>
                          {gradeLabel(a.grade)}
                        </span>
                      </div>
                    </div>
                    {a.feedback && (
                      <p className="text-xs text-gray-400 border-t border-surface-border pt-2">
                        💬 {a.feedback}
                      </p>
                    )}
                    {a.sub_at && <p className="text-xs text-gray-600">Topshirilgan: {fmtDateTime(a.sub_at)}</p>}
                  </div>
                )}

                {/* Pending state */}
                {a.sub_status === 'pending' && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <span className="text-lg">⏳</span>
                    <div className="flex-1">
                      <p className="text-xs text-yellow-300 font-medium">Tekshirish jarayonda</p>
                      {a.sub_at && <p className="text-xs text-gray-500">Topshirildi: {fmtDateTime(a.sub_at)}</p>}
                    </div>
                    <button onClick={() => { setSubmitModal(a); setContent(a.sub_content || ''); setFile(null) }}
                      className="text-xs text-yellow-400 border border-yellow-500/30 px-2 py-1.5 rounded-lg hover:bg-yellow-500/10 transition-all">
                      ✏️ Qayta yuborish
                    </button>
                  </div>
                )}

                {/* Not submitted */}
                {a.sub_status === 'not_submitted' && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => { setSubmitModal(a); setContent(''); setFile(null) }}>
                      📤 Topshirish
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Submit modal */}
      <Modal open={!!submitModal} onClose={() => { setSubmitModal(null); setFile(null) }} title="Topshiriqni topshirish">
        {submitModal && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-surface-hover rounded-xl">
              <p className="font-semibold text-white text-sm">{submitModal.title}</p>
              <p className="text-xs text-primary-400 mt-0.5">{submitModal.course_title}</p>
              {submitModal.description && <p className="text-xs text-gray-400 mt-2">{submitModal.description}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">
                Javob <span className="text-gray-500">(matn)</span>
              </label>
              <textarea rows={3} className="input-field resize-none" value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Topshiriq javobini yozing..."/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">
                Fayl yuklash <span className="text-gray-500">(ixtiyoriy)</span>
              </label>
              <div className="relative">
                <input type="file" id="sub-file" className="hidden"
                  onChange={e => setFile(e.target.files[0] || null)}
                  accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"/>
                <label htmlFor="sub-file"
                  className="flex items-center gap-3 p-3 border border-dashed border-surface-border rounded-xl cursor-pointer hover:border-primary-500/40 hover:bg-primary-500/5 transition-all">
                  <span className="text-2xl">📎</span>
                  <div>
                    {file
                      ? <p className="text-sm text-primary-300 font-medium">{file.name}</p>
                      : <p className="text-sm text-gray-400">Fayl tanlash uchun bosing</p>
                    }
                    <p className="text-xs text-gray-600">PDF, DOC, TXT, ZIP, rasm (max 10MB)</p>
                  </div>
                  {file && (
                    <button type="button" onClick={e => { e.preventDefault(); setFile(null) }}
                      className="ml-auto text-red-400 hover:text-red-300 text-xs">✕</button>
                  )}
                </label>
              </div>
            </div>
            {submitModal.deadline && (
              <p className={`text-xs ${isOverdue(submitModal.deadline) ? 'text-red-400' : 'text-gray-500'}`}>
                📅 Muddat: {fmtDate(submitModal.deadline)}
                {isOverdue(submitModal.deadline) && ' — muddati o\'tgan'}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving} className="flex-1">📤 Topshirish</Button>
              <Button type="button" variant="secondary" onClick={() => setSubmitModal(null)} className="flex-1">Bekor</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function StatusBadge({ status, grade }) {
  if (status === 'graded') return (
    <Badge color="green">✅ Baholangan {grade != null ? `· ${grade}` : ''}</Badge>
  )
  if (status === 'pending') return <Badge color="yellow">⏳ Tekshirilmoqda</Badge>
  return <Badge color="gray">📭 Topshirilmagan</Badge>
}

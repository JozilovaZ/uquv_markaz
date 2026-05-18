import { useState, useEffect } from 'react'
import { assignmentsAPI } from '../../services/api'
import { Card, Badge, PageHeader, Spinner } from '../../components/ui'

const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

function gradeColor(g) {
  if (g >= 86) return 'text-green-400'
  if (g >= 71) return 'text-blue-400'
  if (g >= 56) return 'text-yellow-400'
  if (g >= 41) return 'text-orange-400'
  return 'text-red-400'
}

function gradeLabel(g) {
  if (g >= 86) return 'A'
  if (g >= 71) return 'B'
  if (g >= 56) return 'C'
  if (g >= 41) return 'D'
  return 'F'
}

function GradeRing({ pct, label, sub, color }) {
  const r = 32, c = 2 * Math.PI * r
  const colors = { green: '#22c55e', blue: '#3b82f6', purple: '#945CE9', yellow: '#eab308', gray: '#6b7280' }
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="72" height="72" className="-rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#1f2937" strokeWidth="5"/>
          <circle cx="36" cy="36" r={r} fill="none" stroke={colors[color] || colors.purple} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, Math.max(0, pct)) / 100)}
            style={{ transition: 'stroke-dashoffset .8s ease' }}/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-extrabold text-white">{label}</span>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 text-center">{sub}</p>
    </div>
  )
}

export default function StudentProgress() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    assignmentsAPI.list()
      .then(r => setAssignments(r.data))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  const graded = assignments.filter(a => a.sub_status === 'graded')
  const submitted = assignments.filter(a => a.sub_status !== 'not_submitted')
  const avgGrade = graded.length
    ? Math.round(graded.reduce((s, a) => s + (a.grade || 0), 0) / graded.length)
    : 0
  const completion = assignments.length
    ? Math.round(submitted.length / assignments.length * 100)
    : 0

  const filtered = filter === 'all' ? assignments
    : assignments.filter(a => a.sub_status === filter)

  const statCards = [
    { icon: '📋', label: 'Jami topshiriq',  val: assignments.length, c: 'text-white' },
    { icon: '📤', label: 'Topshirilgan',    val: submitted.length,   c: 'text-blue-400' },
    { icon: '✅', label: 'Baholangan',      val: graded.length,      c: 'text-green-400' },
    { icon: '📭', label: 'Topshirilmagan', val: assignments.length - submitted.length, c: 'text-red-400' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Baholar jurnali"
        subtitle={`${assignments.length} ta topshiriq · ${graded.length} ta baholangan`}
      />

      {/* Summary */}
      <div className="glass border border-surface-border rounded-2xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Umumiy ko'rsatkichlar</p>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="flex gap-6 justify-center">
            <GradeRing
              pct={avgGrade}
              label={graded.length ? avgGrade : '—'}
              sub="O'rt. baho"
              color={avgGrade >= 71 ? 'green' : avgGrade >= 56 ? 'yellow' : graded.length ? 'gray' : 'gray'}
            />
            <GradeRing pct={completion} label={`${completion}%`} sub="Topshirish" color="purple"/>
            <GradeRing
              pct={assignments.length ? graded.length / assignments.length * 100 : 0}
              label={graded.length}
              sub="Baholangan"
              color="blue"
            />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            {statCards.map(x => (
              <div key={x.label} className="bg-surface-hover rounded-xl p-3 flex items-center gap-2 border border-surface-border">
                <span className="text-lg">{x.icon}</span>
                <div>
                  <p className={`text-lg font-extrabold ${x.c}`}>{x.val}</p>
                  <p className="text-[10px] text-gray-500">{x.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['all','Barchasi'],
          ['graded','Baholangan'],
          ['pending','Tekshirilmoqda'],
          ['not_submitted','Topshirilmagan'],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filter === v
                ? 'bg-primary-500 text-white shadow-glow'
                : 'bg-surface-hover text-gray-400 hover:text-white border border-surface-border'
            }`}>{l}</button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-gray-500 text-sm">Topshiriqlar topilmadi</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-3 px-3 text-xs text-gray-500 font-semibold uppercase w-8">№</th>
                  <th className="text-left py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Topshiriq</th>
                  <th className="text-left py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Kurs</th>
                  <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold">Topshirilgan</th>
                  <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold">Baho</th>
                  <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors">
                    <td className="py-3.5 px-3 text-gray-600 text-xs">{i + 1}</td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-white text-sm">{a.title}</p>
                      {a.feedback && (
                        <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">💬 {a.feedback}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {a.course_title}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-xs text-gray-400">
                      {a.sub_at ? fmtDate(a.sub_at) : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {a.sub_status === 'graded' && a.grade != null ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-base font-extrabold ${gradeColor(a.grade)}`}>{a.grade}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg bg-surface-card ${gradeColor(a.grade)}`}>
                            {gradeLabel(a.grade)}
                          </span>
                        </div>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <StatusBadge status={a.sub_status}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 pt-3 border-t border-surface-border mt-2 text-xs text-gray-500">
            <span>🟢 A (86–100)</span>
            <span>🔵 B (71–85)</span>
            <span>🟡 C (56–70)</span>
            <span>🟠 D (41–55)</span>
            <span>🔴 F (0–40)</span>
          </div>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'graded')       return <Badge color="green">✅ Baholangan</Badge>
  if (status === 'pending')      return <Badge color="yellow">⏳ Tekshirilmoqda</Badge>
  return                                <Badge color="gray">📭 Topshirilmagan</Badge>
}

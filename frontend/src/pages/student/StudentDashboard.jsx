import { useState, useEffect } from 'react'
import { enrollmentsAPI, coursesAPI } from '../../services/api'
import { Card, Badge, Spinner } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

const DAYS = ['Du','Se','Ch','Pa','Ju','Sh']
const FULL_DAYS = ['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba']
const TODAY_I = Math.min(Math.max(new Date().getDay()-1,0),5)

const MY_SCH = [
  {day:1,t:'08:00–09:30',name:'Python dasturlash',       room:'301-xona',domla:'J. Toshmatov',col:'purple'},
  {day:2,t:'10:00–11:30',name:'Web Frontend asoslari',   room:'204-xona',domla:'B. Karimov',  col:'blue'  },
  {day:3,t:'14:00–15:30',name:"Ingliz tili (IELTS)",    room:'105-xona',domla:'M. Yusupova', col:'green' },
  {day:4,t:'09:00–10:30',name:"Matematika",             room:'208-xona',domla:'Z. Rahimova', col:'yellow'},
  {day:5,t:'10:00–11:30',name:'Web Frontend asoslari',  room:'204-xona',domla:'B. Karimov',  col:'blue'  },
]
const C={
  purple:{bg:'bg-primary-500/10 border-primary-500/30',tx:'text-primary-300',bar:'bg-primary-500'},
  blue:  {bg:'bg-blue-500/10 border-blue-500/30',      tx:'text-blue-300',   bar:'bg-blue-500'  },
  green: {bg:'bg-green-500/10 border-green-500/30',    tx:'text-green-300',  bar:'bg-green-500' },
  yellow:{bg:'bg-yellow-500/10 border-yellow-500/30',  tx:'text-yellow-300', bar:'bg-yellow-500'},
}

function Ring({pct,clr,lbl,sub}){
  const hex={green:'#22c55e',blue:'#3b82f6',purple:'#945CE9',yellow:'#eab308'}
  const r=38,c=2*Math.PI*r
  return(
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="90" height="90" className="-rotate-90">
          <circle cx="45" cy="45" r={r} fill="none" stroke="#1f2937" strokeWidth="7"/>
          <circle cx="45" cy="45" r={r} fill="none" stroke={hex[clr]} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-pct/100)}
            style={{transition:'stroke-dashoffset .9s ease'}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-extrabold text-white leading-none">{lbl}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1 text-center">{sub}</p>
    </div>
  )
}

export default function StudentDashboard(){
  const {user}=useAuth()
  const [enrollments,setEnrollments]=useState([])
  const [loading,setLoading]=useState(true)
  const today=new Date()

  useEffect(()=>{
    enrollmentsAPI.list().then(r=>setEnrollments(r.data||[])).catch(()=>[]).finally(()=>setLoading(false))
  },[])

  const todayCls=MY_SCH.filter(s=>s.day===TODAY_I)
  if(loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return(
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">HEMIS · Talaba kabineti</p>
          <h1 className="text-xl font-bold text-white mt-0.5">{user?.firstName} — {FULL_DAYS[TODAY_I]}, {today.toLocaleDateString('uz-UZ',{day:'2-digit',month:'long',year:'numeric'})}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="glass border border-surface-border rounded-xl px-3 py-1.5 text-xs text-gray-300">2025–2026, II semestr</span>
          <span className="glass border border-primary-500/30 rounded-xl px-3 py-1.5 text-xs text-primary-300">IT-22 guruh</span>
        </div>
      </div>

      {/* Welcome + GPA rings */}
      <div className="glass border border-surface-border rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-4">Xush kelibsiz, {user?.firstName}! 🎓</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {i:'📚',v:enrollments.length||4,   l:'Fan',      s:'Bu semestr', bc:'border-primary-500/20',tc:'text-primary-300'},
                {i:'✅',v:'87%',                    l:'Davomat',  s:"Jami o'rtacha",bc:'border-green-500/20', tc:'text-green-300' },
                {i:'📝',v:12,                       l:'Topshiriq',s:'Bajarilgan',  bc:'border-blue-500/20',  tc:'text-blue-300'  },
                {i:'📋',v:todayCls.length,          l:'Bugun',    s:'Dars soni',   bc:'border-yellow-500/20',tc:'text-yellow-300'},
              ].map(s=>(
                <div key={s.l} className={`bg-surface-hover rounded-xl p-3 border ${s.bc}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-2xl font-extrabold ${s.tc}`}>{s.v}</p>
                      <p className="text-xs text-gray-300 font-semibold mt-0.5">{s.l}</p>
                      <p className="text-[10px] text-gray-600">{s.s}</p>
                    </div>
                    <span className="text-xl">{s.i}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-5 justify-center flex-shrink-0">
            <Ring pct={91} clr="blue"   lbl="3.82" sub="GPA"/>
            <Ring pct={87} clr="green"  lbl="87%"  sub="Davomat"/>
            <Ring pct={65} clr="purple" lbl="65"   sub="Reyting"/>
          </div>
        </div>
      </div>

      {/* Timetable */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">📅 Haftalik dars jadvali</h3>
          <Badge color="purple">II semestr</Badge>
        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 gap-1.5 min-w-[520px]">
            {DAYS.map((day,i)=>(
              <div key={day}>
                <div className={`text-center text-xs font-bold py-1.5 rounded-lg mb-1.5 ${i===TODAY_I?'bg-primary-500 text-white':'text-gray-500 bg-surface-hover'}`}>{day}</div>
                <div className="space-y-1.5 min-h-[72px]">
                  {MY_SCH.filter(s=>s.day===i).map((s,j)=>{
                    const Cs=C[s.col]
                    return(
                      <div key={j} className={`rounded-lg p-2 border text-[10px] leading-snug ${Cs.bg}`}>
                        <div className={`h-0.5 rounded mb-1 opacity-60 ${Cs.bar}`}/>
                        <p className={`font-semibold line-clamp-2 ${Cs.tx}`}>{s.name}</p>
                        <p className="text-gray-500">{s.t}</p>
                        <p className="text-gray-600 truncate">{s.domla}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today */}
        <Card>
          <h3 className="font-semibold text-white mb-4">⏰ Bugungi darslar ({todayCls.length})</h3>
          {todayCls.length===0?(
            <div className="text-center py-8"><div className="text-3xl mb-2">🏖️</div><p className="text-sm text-gray-500">Bugun dars yo'q</p></div>
          ):(
            <div className="space-y-3">
              {todayCls.map((s,i)=>{
                const Cs=C[s.col]
                return(
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${Cs.bg}`}>
                    <div className={`w-1 h-12 rounded-full ${Cs.bar}`}/>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${Cs.tx}`}>{s.name}</p>
                      <p className="text-xs text-gray-400">{s.domla} · {s.room}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-white">{s.t.split('–')[0]}</p>
                      <p className="text-[10px] text-gray-600">boshlash</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Upcoming deadlines */}
        <Card>
          <h3 className="font-semibold text-white mb-4">📌 Yaqin topshiriqlar</h3>
          <div className="space-y-2">
            {[
              {fan:'Python dasturlash',   t:'OOP loyiha topshirish',     sana:'2026-05-22', holat:'jarayonda', c:'yellow'},
              {fan:'Web Frontend',        t:'React portfolio',            sana:'2026-05-28', holat:'boshlanmagan',c:'red' },
              {fan:'Ingliz tili',         t:'Speaking test',              sana:'2026-05-20', holat:'tayyor',     c:'green'},
              {fan:'Matematika',          t:'Sinov ishi №3',              sana:'2026-05-25', holat:'boshlanmagan',c:'red' },
            ].map((t,i)=>{
              const Cs=C[t.c]||C.purple
              const bc={yellow:'border-yellow-500/20',red:'border-red-500/20',green:'border-green-500/20'}[t.c]||'border-surface-border'
              return(
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl bg-surface-hover border ${bc}`}>
                  <div className={`w-1.5 h-10 rounded-full mt-0.5 flex-shrink-0 ${Cs.bar}`}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{t.fan}</p>
                    <p className="text-sm font-semibold text-white">{t.t}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{t.sana}</p>
                    <Badge color={t.c==='green'?'green':t.c==='red'?'red':'yellow'} className="text-[10px]">
                      {t.holat}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

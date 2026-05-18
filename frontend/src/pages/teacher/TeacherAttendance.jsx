import { useState } from 'react'
import { Card, Badge, PageHeader, Avatar, Button } from '../../components/ui'

const FANS = [
  { id:1, name:'Python dasturlash',      grp:'IT-22', talabalar:18 },
  { id:2, name:'Web Frontend asoslari',  grp:'IT-23', talabalar:24 },
  { id:3, name:"Algoritm va ma'lumotlar",grp:'IT-24', talabalar:20 },
]

const ALL_STUDENTS = {
  1:[
    {id:1, nm:'Abdullayev Jasur'   }, {id:2, nm:'Karimova Malika'  },
    {id:3, nm:'Toshmatov Bobur'    }, {id:4, nm:"Xo'jayeva Nilufar"},
    {id:5, nm:'Mirzayev Sardor'    }, {id:6, nm:'Rahimova Zulfiya' },
    {id:7, nm:'Sobirov Otabek'     }, {id:8, nm:'Nazarova Kamola'  },
  ],
  2:[
    {id:9, nm:'Yusupov Asilbek'   }, {id:10, nm:'Hasanova Dilnoza' },
    {id:11,nm:'Aliyev Umid'       }, {id:12, nm:"Qosimova Maftuna" },
    {id:13,nm:'Normatov Sherzod'  }, {id:14, nm:'Ergasheva Shahnoza'},
  ],
  3:[
    {id:15,nm:'Tursunov Behruz'   }, {id:16, nm:'Qodirov Murod'   },
    {id:17,nm:'Islomova Gulnora'  }, {id:18, nm:"Holiqov Nurbek"  },
  ],
}

// Generate last 8 session dates
const genDates = ()=>{
  const dates=[]
  const d=new Date()
  for(let i=7;i>=0;i--){
    const dd=new Date(d)
    dd.setDate(d.getDate()-i*3)
    dates.push(dd.toISOString().split('T')[0])
  }
  return dates
}
const SESSION_DATES = genDates()

// Pre-fill random attendance history
function initHistory(fanId){
  const students=ALL_STUDENTS[fanId]||[]
  const hist={}
  students.forEach(s=>{
    hist[s.id]={}
    SESSION_DATES.forEach((date,i)=>{
      if(i<SESSION_DATES.length-1){
        hist[s.id][date] = Math.random()>0.15 ? 1 : 0
      }
    })
  })
  return hist
}

const STATUS_MAP={ 1:{label:"Keldi",c:'green'}, 0:{label:"Kelmadi",c:'red'}, null:{label:"—",c:'gray'} }

export default function TeacherAttendance() {
  const [activeFan, setActiveFan]   = useState(FANS[0])
  const [date, setDate]             = useState(new Date().toISOString().split('T')[0])
  const [hist, setHist]             = useState(()=>initHistory(1))
  const [saved, setSaved]           = useState(false)
  const [view, setView]             = useState('today') // today | history

  const students = ALL_STUDENTS[activeFan.id] || []

  function toggle(studentId){
    setSaved(false)
    setHist(h=>({...h,[studentId]:{...h[studentId],[date]:h[studentId]?.[date]===1?0:1}}))
  }
  function markAll(val){
    setSaved(false)
    setHist(h=>{
      const next={...h}
      students.forEach(s=>{ next[s.id]={...next[s.id],[date]:val} })
      return next
    })
  }
  function handleSave(){
    setSaved(true)
    setTimeout(()=>setSaved(false),3000)
  }
  function changeFan(f){
    setActiveFan(f)
    setHist(initHistory(f.id))
    setSaved(false)
  }

  const todayPresent = students.filter(s=>hist[s.id]?.[date]===1).length
  const todayAbsent  = students.filter(s=>hist[s.id]?.[date]===0).length
  const totalPct     = students.length ? Math.round(todayPresent/students.length*100) : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Davomat jurnali" subtitle="Sana va fan bo'yicha davomat belgilash"/>

      {/* Fan tabs */}
      <div className="flex gap-2 flex-wrap">
        {FANS.map(f=>(
          <button key={f.id} onClick={()=>changeFan(f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeFan.id===f.id?'bg-primary-500 text-white shadow-glow':'glass text-gray-400 hover:text-white border border-surface-border'
            }`}>
            📚 {f.name}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeFan.id===f.id?'bg-white/20':'bg-surface-hover'}`}>{f.grp}</span>
          </button>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        {[['today',"Bugungi davomat"],['history',"Davomat tarixi"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view===v?'bg-surface-hover border border-primary-500/50 text-primary-300':'text-gray-500 hover:text-gray-300'
            }`}>{l}</button>
        ))}
      </div>

      {view==='today'&&(
        <>
          {/* Date + stats */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="glass border border-surface-border rounded-xl px-4 py-2.5 flex items-center gap-3">
              <span className="text-gray-400 text-sm">📅 Sana:</span>
              <input type="date" value={date} onChange={e=>{setDate(e.target.value);setSaved(false)}}
                className="bg-transparent text-white text-sm font-semibold focus:outline-none"/>
            </div>
            <div className="flex gap-2">
              <div className="glass border border-green-500/20 rounded-xl px-4 py-2 text-center flex-1">
                <p className="text-xl font-extrabold text-green-400">{todayPresent}</p>
                <p className="text-[10px] text-gray-500">Keldi</p>
              </div>
              <div className="glass border border-red-500/20 rounded-xl px-4 py-2 text-center flex-1">
                <p className="text-xl font-extrabold text-red-400">{todayAbsent}</p>
                <p className="text-[10px] text-gray-500">Kelmadi</p>
              </div>
              <div className="glass border border-surface-border rounded-xl px-4 py-2 text-center flex-1">
                <p className={`text-xl font-extrabold ${totalPct>=80?'text-green-400':'text-yellow-400'}`}>{totalPct}%</p>
                <p className="text-[10px] text-gray-500">Davomat</p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button variant="success" size="sm" onClick={()=>markAll(1)}>✅ Barchasi keldi</Button>
            <Button variant="danger"  size="sm" onClick={()=>markAll(0)}>❌ Barchasi kelmadi</Button>
          </div>

          {/* Student list */}
          <Card>
            <div className="space-y-2">
              {students.map((s,i)=>{
                const status=hist[s.id]?.[date]
                const isPresent=status===1
                const isAbsent=status===0
                return (
                  <div key={s.id}
                    onClick={()=>toggle(s.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                      isPresent?'bg-green-500/8 border-green-500/25 hover:bg-green-500/15':
                      isAbsent ?'bg-red-500/8 border-red-500/25 hover:bg-red-500/15':
                               'bg-surface-hover border-surface-border hover:bg-surface-border'
                    }`}>
                    <span className="text-xs text-gray-600 font-bold w-5 text-center flex-shrink-0">{i+1}</span>
                    <Avatar name={s.nm} size="sm"/>
                    <span className="flex-1 text-sm font-semibold text-white">{s.nm}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      isPresent?'bg-green-500 text-white':
                      isAbsent ?'bg-red-500 text-white':
                               'bg-surface-border text-gray-500'
                    }`}>
                      {isPresent?'✓':isAbsent?'✗':'–'}
                    </div>
                    <Badge color={isPresent?'green':isAbsent?'red':'gray'}>
                      {isPresent?'Keldi':isAbsent?'Kelmadi':'Belgilanmagan'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} loading={false}>
              💾 Davomatni saqlash
            </Button>
            {saved&&<span className="text-sm text-green-400 font-semibold">✅ Saqlandi!</span>}
          </div>
        </>
      )}

      {view==='history'&&(
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{minWidth: `${180+SESSION_DATES.length*52}px`}}>
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left py-2.5 px-3 text-xs text-gray-500 font-semibold uppercase sticky left-0 bg-surface-card">F.I.O</th>
                  {SESSION_DATES.map(d=>(
                    <th key={d} className="text-center py-2.5 px-2 text-xs text-gray-500 font-semibold whitespace-nowrap">
                      {new Date(d).toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit'})}
                    </th>
                  ))}
                  <th className="text-center py-2.5 px-3 text-xs text-gray-500 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s,i)=>{
                  const attended=SESSION_DATES.filter(d=>hist[s.id]?.[d]===1).length
                  const total=SESSION_DATES.filter(d=>hist[s.id]?.[d]!==undefined).length
                  const pct=total?Math.round(attended/total*100):0
                  return (
                    <tr key={s.id} className="border-b border-surface-border/50 hover:bg-surface-hover">
                      <td className="py-2.5 px-3 sticky left-0 bg-surface-card">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-4">{i+1}</span>
                          <span className="text-sm font-semibold text-white whitespace-nowrap">{s.nm}</span>
                        </div>
                      </td>
                      {SESSION_DATES.map(d=>{
                        const v=hist[s.id]?.[d]
                        return (
                          <td key={d} className="text-center py-2.5 px-2">
                            {v===1?<span className="text-green-400 font-bold text-base">+</span>
                            :v===0?<span className="text-red-400 font-bold text-base">–</span>
                            :<span className="text-gray-700">·</span>}
                          </td>
                        )
                      })}
                      <td className="text-center py-2.5 px-3">
                        <span className={`font-bold text-sm ${pct>=80?'text-green-400':pct>=60?'text-yellow-400':'text-red-400'}`}>{pct}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-600 mt-3">+ = Keldi &nbsp;|&nbsp; – = Kelmadi &nbsp;|&nbsp; · = Ma'lumot yo'q</p>
        </Card>
      )}
    </div>
  )
}

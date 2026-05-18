import { useState } from 'react'
import { Card, Badge, Avatar, PageHeader, Modal } from '../../components/ui'

const GROUPS = [
  {
    id:1, grp:'IT-22', fan:'Python dasturlash', kurs:3, talabalar:[
      {id:1,  nm:'Abdullayev Jasur',    o1:28, o2:27, jor:22, yak:17, dav:92},
      {id:2,  nm:'Karimova Malika',     o1:30, o2:29, jor:24, yak:18, dav:88},
      {id:3,  nm:'Toshmatov Bobur',     o1:22, o2:24, jor:19, yak:14, dav:79},
      {id:4,  nm:"Xo'jayeva Nilufar",   o1:26, o2:25, jor:21, yak:16, dav:95},
      {id:5,  nm:'Mirzayev Sardor',     o1:18, o2:20, jor:15, yak:11, dav:67},
      {id:6,  nm:'Rahimova Zulfiya',    o1:29, o2:28, jor:23, yak:17, dav:91},
      {id:7,  nm:'Sobirov Otabek',      o1:24, o2:22, jor:18, yak:13, dav:83},
      {id:8,  nm:'Nazarova Kamola',     o1:27, o2:26, jor:22, yak:16, dav:88},
    ]
  },
  {
    id:2, grp:'IT-23', fan:'Web Frontend asoslari', kurs:3, talabalar:[
      {id:9,  nm:'Yusupov Asilbek',     o1:25, o2:26, jor:20, yak:15, dav:85},
      {id:10, nm:'Hasanova Dilnoza',    o1:30, o2:30, jor:24, yak:18, dav:100},
      {id:11, nm:'Aliyev Umid',         o1:20, o2:19, jor:16, yak:12, dav:73},
      {id:12, nm:"Qosimova Maftuna",    o1:28, o2:27, jor:22, yak:17, dav:90},
      {id:13, nm:'Normatov Sherzod',    o1:15, o2:18, jor:13, yak:10, dav:61},
      {id:14, nm:'Ergasheva Shahnoza',  o1:29, o2:28, jor:23, yak:17, dav:93},
    ]
  },
  {
    id:3, grp:'IT-24', fan:"Algoritm va ma'lumotlar", kurs:3, talabalar:[
      {id:15, nm:'Tursunov Behruz',     o1:26, o2:24, jor:20, yak:15, dav:87},
      {id:16, nm:'Qodirov Murod',       o1:22, o2:21, jor:17, yak:13, dav:76},
      {id:17, nm:'Islomova Gulnora',    o1:30, o2:29, jor:24, yak:18, dav:97},
      {id:18, nm:"Holiqov Nurbek",      o1:19, o2:20, jor:16, yak:12, dav:70},
    ]
  },
]

function ball(s){ return s.o1+s.o2+s.jor+s.yak }
function baho(total){
  if(total>=86) return {l:'A',desc:"A'lo",  c:'green'}
  if(total>=71) return {l:'B',desc:'Yaxshi', c:'blue'}
  if(total>=56) return {l:'C',desc:"Qoniqarli",c:'yellow'}
  return {l:'D',desc:"Qoniqarsiz",c:'red'}
}

export default function TeacherStudents() {
  const [activeGrp, setActiveGrp] = useState(GROUPS[0])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = activeGrp.talabalar.filter(t=>
    t.nm.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Talabalar jurnali"
        subtitle="Guruh bo'yicha baholar va davomat ko'rsatkichlari"/>

      {/* Group tabs */}
      <div className="flex gap-2 flex-wrap">
        {GROUPS.map(g=>(
          <button key={g.id} onClick={()=>{setActiveGrp(g);setSearch('')}}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeGrp.id===g.id?'bg-primary-500 text-white shadow-glow':'glass text-gray-400 hover:text-white border border-surface-border'
            }`}>
            👥 {g.grp}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeGrp.id===g.id?'bg-white/20':'bg-surface-hover'}`}>
              {g.talabalar.length}
            </span>
          </button>
        ))}
      </div>

      {/* Fan info */}
      <div className="glass rounded-xl p-3 border border-surface-border flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="font-semibold text-white">📚 {activeGrp.fan}</span>
        <span className="text-gray-400">Guruh: <b className="text-gray-200">{activeGrp.grp}</b></span>
        <span className="text-gray-400">Talabalar: <b className="text-gray-200">{activeGrp.talabalar.length}</b></span>
        <span className="text-gray-400">O'rtacha ball:
          <b className="text-gray-200 ml-1">
            {(activeGrp.talabalar.reduce((a,s)=>a+ball(s),0)/activeGrp.talabalar.length).toFixed(1)}
          </b>
        </span>
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 Talaba ismi bo'yicha qidirish..."
        className="input-field w-full text-sm"/>

      {/* Grade journal table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-semibold uppercase w-8">№</th>
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-semibold uppercase">F.I.O</th>
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Oraliq-1<br/><span className="font-normal">(30)</span></th>
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Oraliq-2<br/><span className="font-normal">(30)</span></th>
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Joriy<br/><span className="font-normal">(25)</span></th>
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Yakuniy<br/><span className="font-normal">(20)</span></th>
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Jami<br/><span className="font-normal">(100+)</span></th>
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Davomat</th>
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-semibold uppercase">Baho</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s,i)=>{
                const total=ball(s)
                const b=baho(total)
                const badgeColor={green:'green',blue:'blue',yellow:'yellow',red:'red'}[b.c]
                return (
                  <tr key={s.id} onClick={()=>setSelected(s)}
                    className="border-b border-surface-border/50 hover:bg-surface-hover cursor-pointer transition-colors">
                    <td className="py-3 px-3 text-gray-500 text-xs">{i+1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.nm} size="sm"/>
                        <span className="text-sm font-semibold text-white">{s.nm}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-bold ${s.o1>=24?'text-green-400':s.o1>=18?'text-blue-400':'text-red-400'}`}>{s.o1}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-bold ${s.o2>=24?'text-green-400':s.o2>=18?'text-blue-400':'text-red-400'}`}>{s.o2}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-bold ${s.jor>=20?'text-green-400':s.jor>=15?'text-blue-400':'text-red-400'}`}>{s.jor}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-bold ${s.yak>=16?'text-green-400':s.yak>=12?'text-blue-400':'text-red-400'}`}>{s.yak}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-base font-extrabold text-white">{total}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-bold ${s.dav>=80?'text-green-400':s.dav>=60?'text-yellow-400':'text-red-400'}`}>{s.dav}%</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge color={badgeColor}>{b.l} — {b.desc}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4 pt-4 border-t border-surface-border mt-2 text-xs text-gray-500">
          <span>🟢 A (86–100) = A'lo</span>
          <span>🔵 B (71–85) = Yaxshi</span>
          <span>🟡 C (56–70) = Qoniqarli</span>
          <span>🔴 D (0–55) = Qoniqarsiz</span>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={()=>setSelected(null)} title="Talaba ma'lumoti">
        {selected&&(()=>{
          const total=ball(selected)
          const b=baho(total)
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-surface-hover rounded-xl">
                <Avatar name={selected.nm} size="lg"/>
                <div>
                  <h3 className="font-bold text-white text-lg">{selected.nm}</h3>
                  <p className="text-sm text-gray-400">{activeGrp.grp} · {activeGrp.fan}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Oraliq-1 (30)',  selected.o1, selected.o1>=24?'green':selected.o1>=18?'blue':'red'],
                  ['Oraliq-2 (30)',  selected.o2, selected.o2>=24?'green':selected.o2>=18?'blue':'red'],
                  ['Joriy (25)',     selected.jor, selected.jor>=20?'green':selected.jor>=15?'blue':'red'],
                  ['Yakuniy (20)',   selected.yak, selected.yak>=16?'green':selected.yak>=12?'blue':'red'],
                ].map(([lbl,val,col])=>(
                  <div key={lbl} className="bg-surface-hover rounded-xl p-3 text-center border border-surface-border">
                    <p className="text-xs text-gray-500 mb-1">{lbl}</p>
                    <p className={`text-2xl font-extrabold text-${col}-400`}>{val}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-surface-hover rounded-xl p-3 border border-surface-border">
                  <p className="text-xs text-gray-500 mb-1">Jami ball</p>
                  <p className="text-3xl font-extrabold text-white">{total}</p>
                </div>
                <div className="bg-surface-hover rounded-xl p-3 border border-surface-border">
                  <p className="text-xs text-gray-500 mb-1">Davomat</p>
                  <p className={`text-3xl font-extrabold ${selected.dav>=80?'text-green-400':'text-yellow-400'}`}>{selected.dav}%</p>
                </div>
                <div className="bg-surface-hover rounded-xl p-3 border border-surface-border">
                  <p className="text-xs text-gray-500 mb-1">Baho</p>
                  <p className="text-3xl font-extrabold text-primary-300">{b.l}</p>
                  <p className="text-xs text-gray-500">{b.desc}</p>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

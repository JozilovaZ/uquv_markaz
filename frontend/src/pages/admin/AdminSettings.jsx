import { useState } from 'react'
import { Card, Button, Input, PageHeader } from '../../components/ui'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [general, setGeneral]   = useState({ name: 'EduCore', address: 'Toshkent, Yunusobod', phone: '+998 71 200 00 00', email: 'info@educore.uz' })
  const [password, setPassword] = useState({ current: '', newPass: '', confirm: '' })

  function saveGeneral(e) { e.preventDefault(); toast.success("Sozlamalar saqlandi") }
  function savePassword(e) {
    e.preventDefault()
    if (password.newPass !== password.confirm) { toast.error("Parollar mos emas"); return }
    toast.success("Parol yangilandi")
    setPassword({ current: '', newPass: '', confirm: '' })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title="Sozlamalar" subtitle="Tizim sozlamalari va profilni boshqarish"/>

      <Card>
        <h3 className="font-semibold text-white mb-4">Umumiy sozlamalar</h3>
        <form onSubmit={saveGeneral} className="space-y-4">
          <Input label="Markaz nomi" value={general.name} onChange={e => setGeneral({ ...general, name: e.target.value })}/>
          <Input label="Manzil" value={general.address} onChange={e => setGeneral({ ...general, address: e.target.value })}/>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefon" value={general.phone} onChange={e => setGeneral({ ...general, phone: e.target.value })}/>
            <Input label="Email" type="email" value={general.email} onChange={e => setGeneral({ ...general, email: e.target.value })}/>
          </div>
          <Button type="submit">💾 Saqlash</Button>
        </form>
      </Card>

      <Card>
        <h3 className="font-semibold text-white mb-4">Parolni o'zgartirish</h3>
        <form onSubmit={savePassword} className="space-y-4">
          <Input label="Joriy parol" type="password" value={password.current} onChange={e => setPassword({ ...password, current: e.target.value })} placeholder="••••••••"/>
          <Input label="Yangi parol" type="password" value={password.newPass} onChange={e => setPassword({ ...password, newPass: e.target.value })} placeholder="••••••••"/>
          <Input label="Tasdiqlash" type="password" value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} placeholder="••••••••"/>
          <Button type="submit" variant="secondary">🔒 Parolni yangilash</Button>
        </form>
      </Card>
    </div>
  )
}

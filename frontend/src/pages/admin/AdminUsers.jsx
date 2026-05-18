import { useState, useEffect } from 'react'
import { usersAPI } from '../../services/api'
import { Card, Button, Badge, Avatar, Modal, Input, Select, PageHeader, Spinner, EmptyState } from '../../components/ui'
import toast from 'react-hot-toast'

const ROLE_MAP = { admin: { label: 'Admin', color: 'red' }, manager: { label: 'Menejer', color: 'blue' }, teacher: { label: "O'qituvchi", color: 'green' }, user: { label: "O'quvchi", color: 'purple' } }

export default function AdminUsers() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [modal, setModal]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]     = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await usersAPI.list()
      setUsers(data)
    } catch { toast.error('Foydalanuvchilarni yuklashda xatolik') }
    finally { setLoading(false) }
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      if (selected) {
        await usersAPI.update(selected.id, form)
        toast.success('Yangilandi')
      }
      await load(); setModal(null)
    } catch { toast.error('Xatolik yuz berdi') }
  }

  async function handleDelete(id) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return
    try { await usersAPI.delete(id); setUsers(u => u.filter(x => x.id !== id)); toast.success("O'chirildi") }
    catch { toast.error('Xatolik') }
  }

  const filtered = users.filter(u => {
    const s = search.toLowerCase()
    return (roleFilter === 'all' || u.role === roleFilter) &&
      (u.firstName?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s))
  })

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Foydalanuvchilar" subtitle={`Jami: ${users.length} ta foydalanuvchi`}/>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."
              className="input-field pl-10"/>
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-40">
            <option value="all">Barchasi</option>
            <option value="admin">Admin</option>
            <option value="manager">Menejer</option>
            <option value="teacher">O'qituvchi</option>
            <option value="user">O'quvchi</option>
          </select>
        </div>

        {filtered.length === 0 ? <EmptyState icon="👥" title="Foydalanuvchi topilmadi"/> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Foydalanuvchi', 'Email', 'Rol', 'Amal'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const role = ROLE_MAP[u.role] || ROLE_MAP.user
                  return (
                    <tr key={u.id} className="table-row">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.firstName || '?'} size="md"/>
                          <span className="font-medium text-gray-200">{u.firstName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-400">{u.email}</td>
                      <td className="py-3 px-3"><Badge color={role.color}>{role.label}</Badge></td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" icon="✏️" onClick={() => { setSelected(u); setForm({ role: u.role }); setModal('edit') }}>Tahrir</Button>
                          <Button size="sm" variant="danger" icon="🗑️" onClick={() => handleDelete(u.id)}>O'chir</Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Foydalanuvchini tahrirlash">
        <form onSubmit={handleSave} className="space-y-4">
          <Select label="Rol" value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })}
            options={[{ value: 'user', label: "O'quvchi" }, { value: 'teacher', label: "O'qituvchi" }, { value: 'manager', label: 'Menejer' }, { value: 'admin', label: 'Admin' }]}/>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Saqlash</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)} className="flex-1">Bekor</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

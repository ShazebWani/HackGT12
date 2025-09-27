import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function MessagesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [input, setInput] = useState('')

  useEffect(() => {
    const auth = localStorage.getItem('auth')
    if (!auth) {
      router.replace('/login')
      return
    }
    const u = JSON.parse(auth)
    if (u.role !== 'patient') {
      router.replace('/')
      return
    }
    setUser(u)
    // load conversations (for simplicity, read messages for this username)
    const key = `messages:${u.username}`
    const msgs = JSON.parse(localStorage.getItem(key) || '[]')
    // group by sender
    const grouped: Record<string, any[]> = {}
    msgs.forEach((m: any) => {
      const who = m.from || 'Unknown'
      grouped[who] = grouped[who] || []
      grouped[who].push(m)
    })
    const convs = Object.keys(grouped).map(name => ({ name, last: grouped[name].slice(-1)[0], messages: grouped[name] }))
    setConversations(convs)
    if (convs.length > 0) setActive(convs[0].name)
  }, [])

  const logout = () => {
    localStorage.removeItem('auth')
    router.replace('/login')
  }

  if (!user) return null

  const sendMessage = () => {
    if (!active || !input.trim()) return
    const msg = { from: user.username, type: 'message', body: input.trim(), timestamp: Date.now() }
    // append to patient's storage (conversation with active user)
    const key = `messages:${user.username}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.push(msg)
    localStorage.setItem(key, JSON.stringify(existing))
    // update UI
    setInput('')
    // reload conversations
    const grouped: Record<string, any[]> = {}
    existing.forEach((m: any) => {
      const who = m.from || 'Unknown'
      grouped[who] = grouped[who] || []
      grouped[who].push(m)
    })
    const convs = Object.keys(grouped).map(name => ({ name, last: grouped[name].slice(-1)[0], messages: grouped[name] }))
    setConversations(convs)
  }

  return (
    <div className="flex h-screen bg-base">
      <div className="w-full max-w-6xl mx-auto p-6 grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Conversations</h2>
            <div>
              <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
            </div>
          </div>
          <div className="space-y-3">
            {conversations.map(c => (
              <div key={c.name} onClick={() => setActive(c.name)} className={`medical-card p-3 cursor-pointer ${active === c.name ? 'ring-2 ring-accent-1' : ''}`}>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-gray-600">{c.last?.body || 'No messages yet'}</div>
              </div>
            ))}
            {conversations.length === 0 && <div className="text-gray-600">No conversations yet</div>}
          </div>
        </div>

        <div className="col-span-2">
          <h2 className="text-xl font-semibold mb-4">{active || 'Select a conversation'}</h2>
          <div className="medical-card p-4 h-[60vh] overflow-auto">
            {active ? (
              (conversations.find(c => c.name === active)?.messages || []).map((m: any, idx: number) => (
                <div key={idx} className={`mb-3 ${m.from === user.username ? 'text-right' : ''}`}>
                  <div className="inline-block bg-gray-100 p-2 rounded">{m.body || (m.type === 'results' ? 'Results sent' : '')}</div>
                  <div className="text-xs text-gray-500">{new Date(m.timestamp).toLocaleString()}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-600">Choose a conversation on the left to view messages.</div>
            )}
          </div>

          {active && (
            <div className="flex items-center gap-2 mt-3">
              <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 border rounded px-3 py-2" />
              <button onClick={sendMessage} className="bg-accent-1 text-white px-4 py-2 rounded">Send</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

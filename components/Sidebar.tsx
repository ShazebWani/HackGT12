import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Stethoscope, SidebarClose, ChevronRight, Settings, MessageSquare, LogOut } from 'lucide-react'

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const auth = localStorage.getItem('auth')
    if (auth) setUser(JSON.parse(auth))
  }, [])

  const logout = () => {
    localStorage.removeItem('auth')
    router.push('/login')
  }

  return (
    <aside className={`h-full bg-accent-2/30 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className='flex justify-between items-center h-12 p-4'>
        <Stethoscope className="text-white" />
        <button
          aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
          onClick={() => setCollapsed(v => !v)}
          className="p-1 rounded hover:bg-accent-2/20 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className='text-white h-5 w-5' />
          ) : (
            <SidebarClose className='text-white h-5 w-5' />
          )}
        </button>
      </div>

      {/* Account Tab */}
      <div className={`p-4 border-t border-white/10 ${collapsed ? 'text-center' : ''}`}>
        {user ? (
          <div className={`${collapsed ? 'text-xs' : ''}`}>
            <div className="font-semibold text-white">{collapsed ? user.username?.charAt(0).toUpperCase() : user.username}</div>
            {!collapsed && <div className="text-sm text-white/80">{user.role}</div>}
          </div>
        ) : (
          <Link href="/login" className="text-sm text-white">Sign in</Link>
        )}
      </div>

      {/* Tabs */}
      <nav className="mt-4 px-2">
        <ul className="space-y-2">
          <li>
            <Link href="/settings" className="flex items-center gap-3 text-white p-2 rounded hover:bg-accent-2/20">
              <Settings className="h-4 w-4" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </li>
          <li>
            <Link href="/messages" className="flex items-center gap-3 text-white p-2 rounded hover:bg-accent-2/20">
              <MessageSquare className="h-4 w-4" />
              {!collapsed && <span>Messages</span>}
            </Link>
          </li>
          <li>
            <button onClick={logout} className="w-full text-left flex items-center gap-3 text-white p-2 rounded hover:bg-accent-2/20">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
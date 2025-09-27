import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'doctor' | 'patient' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignup, setIsSignup] = useState(false)

  useEffect(() => {
    // If already logged in, redirect based on role
    const auth = localStorage.getItem('auth')
    if (auth) {
      const user = JSON.parse(auth)
      if (user.role === 'patient') router.replace('/messages')
      else router.replace('/')
    }
  }, [])

  const handleSubmit = (e: any) => {
    e.preventDefault()
    // Very simple fake auth: store user in localStorage
    const user = {
      role: role || 'patient',
      email,
      username: isSignup ? username : email.split('@')[0],
      token: 'fake-token-' + Math.random().toString(36).slice(2, 9)
    }
    localStorage.setItem('auth', JSON.stringify(user))
    if (user.role === 'patient') router.push('/messages')
    else router.push('/')
  }

  return (
    <div className="flex h-screen items-center justify-center bg-base">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Log in</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">Role</label>
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded ${role === 'doctor' ? 'bg-accent-1 text-white' : 'bg-gray-100'}`}
              onClick={() => setRole('doctor')}
              type="button"
            >
              Doctor
            </button>
            <button
              className={`px-4 py-2 rounded ${role === 'patient' ? 'bg-accent-1 text-white' : 'bg-gray-100'}`}
              onClick={() => setRole('patient')}
              type="button"
            >
              Patient
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input id="signup" type="checkbox" checked={isSignup} onChange={e => setIsSignup(e.target.checked)} />
              <label htmlFor="signup" className="text-sm text-gray-600">Sign up instead</label>
            </div>
            <button className="bg-accent-1 text-white px-4 py-2 rounded">{isSignup ? 'Sign up' : 'Log in'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

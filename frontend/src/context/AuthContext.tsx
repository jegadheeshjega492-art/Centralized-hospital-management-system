'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

// ── Types ──────────────────────────────────────────────────
type Role = 'PATIENT' | 'DOCTOR' | 'HOSPITAL_ADMIN'

interface User {
  id:       number
  username: string
  email:    string
  role:     Role
}

interface AuthContextType {
  user:    User | null
  loading: boolean
  login:   (username: string, password: string) => Promise<void>
  logout:  () => void
}

// ── Context ────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

// ── Provider ───────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)  // true on first load while we check localStorage
  const router = useRouter()

  // On app load — if a token exists in localStorage, fetch the current user
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/auth/me/')
        .then((res) => setUser(res.data))
        .catch(() => {
          // Token is invalid or expired — clear it
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Login — calls your Django JWT endpoint, stores tokens, fetches user
const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login/', { username, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)

    const meRes = await api.get('/auth/me/')
    console.log('User data:', meRes.data)
    setUser(meRes.data)

    if (meRes.data.role === 'PATIENT')        router.push('/patient/dashboard')
    else if (meRes.data.role === 'HOSPITAL_ADMIN') router.push('/dashboard/hospital')
    else if (meRes.data.role === 'DOCTOR')    router.push('/dashboard/doctor')
    else {
        // role is empty — shouldn't happen but clear storage and show error
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        throw new Error('User role is not set. Contact admin.')
    }
}

  // Logout — wipe tokens and go to login page
  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook — teammates use this in any component ─────────────
// Usage: const { user, login, logout } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
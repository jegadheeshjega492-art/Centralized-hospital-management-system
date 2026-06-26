'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface Props {
  children:     React.ReactNode
  allowedRoles?: ('PATIENT' | 'DOCTOR' | 'HOSPITAL_ADMIN')[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return  // wait until auth check is done

    // Not logged in at all — go to login
    if (!user) {
      router.push('/login')
      return
    }

    // Logged in but wrong role for this page
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized')
    }
  }, [user, loading, allowedRoles, router])

  // Show nothing while checking auth — prevents flicker
  if (loading || !user) return null

  return <>{children}</>
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import api from '@/lib/api'

interface Doctor {
  id: number
  doctor_name: string
  department: string
  license_number: string
}

interface Hospital {
  id: number
  name: string
  registration_number: string
  contact_email: string
  verified: boolean
}

export default function HospitalDashboard() {
  const router = useRouter()
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [doctors,  setDoctors]  = useState<Doctor[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    api.get('/hospitals/dashboard/')
      .then(res => {
        setHospital(res.data.hospital)
        setDoctors(res.data.doctors)
      })
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
        {error   && <p style={{ color: '#dc2626' }}>{error}</p>}

        {hospital && (
          <>
            {/* Hospital info card */}
            <div style={{
              background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb',
              padding: '24px 28px', marginBottom: '32px',
              borderLeft: `4px solid ${hospital.verified ? '#16a34a' : '#f59e0b'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '6px' }}>
                    {hospital.name}
                  </h1>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
                    Reg. No: {hospital.registration_number}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    {hospital.contact_email}
                  </p>
                </div>
                <span style={{
                  padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                  background: hospital.verified ? '#f0fdf4' : '#fffbeb',
                  color:      hospital.verified ? '#15803d' : '#b45309',
                }}>
                  {hospital.verified ? '✓ Verified' : '⏳ Pending verification'}
                </span>
              </div>
            </div>

            {/* Doctors section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 500 }}>
                Doctors ({doctors.length})
              </h2>
              <button
                onClick={() => router.push('/dashboard/hospital/doctors/new')}
                style={{
                  background: '#1a1a2e', color: '#fff', border: 'none',
                  padding: '8px 18px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer'
                }}
              >
                + Add doctor
              </button>
            </div>

            {doctors.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 24px',
                background: '#f9fafb', borderRadius: '12px', border: '0.5px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>👨‍⚕️</p>
                <p style={{ fontWeight: 500, marginBottom: '6px' }}>No doctors yet</p>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
                  Add your first doctor to get started.
                </p>
                <button
                  onClick={() => router.push('/dashboard/hospital/doctors/new')}
                  style={{
                    background: '#1a1a2e', color: '#fff', border: 'none',
                    padding: '10px 20px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  Add first doctor
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {doctors.map(doc => (
                  <div key={doc.id} style={{
                    background: '#fff', borderRadius: '10px',
                    border: '0.5px solid #e5e7eb', padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>{doc.doctor_name}</p>
                      <p style={{ color: '#6b7280', fontSize: '13px' }}>
                        {doc.department} · License: {doc.license_number}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </ProtectedRoute>
  )
}
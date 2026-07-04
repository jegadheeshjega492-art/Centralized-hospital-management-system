'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import api from '@/lib/api'

interface DoctorProfile {
  doctor_name:    string
  hospital_name:  string
  department:     string
  license_number: string
}

export default function DoctorDashboard() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get('/hospitals/doctor-profile/')
      .then(res => setProfile(res.data))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>

        {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
        {error   && <p style={{ color: '#dc2626' }}>{error}</p>}

        {profile && (
          <>
            {/* Profile card */}
            <div style={{
              background: '#fff', borderRadius: '12px',
              border: '0.5px solid #e5e7eb', padding: '28px',
              marginBottom: '28px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: '#eef2ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '22px'
                  }}>
                    👨‍⚕️
                  </div>
                  <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '4px' }}>
                      {profile.doctor_name}
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                      {profile.department} · {profile.hospital_name}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '16px', marginTop: '24px',
                paddingTop: '20px', borderTop: '0.5px solid #f3f4f6'
              }}>
                {[
                  { label: 'Hospital',        value: profile.hospital_name },
                  { label: 'Department',      value: profile.department },
                  { label: 'License number',  value: profile.license_number },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: '#f9fafb', borderRadius: '12px',
              border: '0.5px solid #e5e7eb', padding: '32px', textAlign: 'center'
            }}>
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>🏗️</p>
              <p style={{ fontWeight: 500, marginBottom: '6px' }}>Patient records coming soon</p>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Search patients and add medical records will appear here in the next phase.
              </p>
            </div>
          </>
        )}

      </div>
    </ProtectedRoute>
  )
}
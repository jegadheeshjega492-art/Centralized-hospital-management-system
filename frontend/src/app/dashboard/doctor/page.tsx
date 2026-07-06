'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import api from '@/lib/api'

interface DoctorProfile {
  doctor_name:    string
  hospital_name:  string
  department:     string
  license_number: string
}

export default function DoctorDashboard() {
  const router   = useRouter()
  const [profile,    setProfile]    = useState<DoctorProfile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [patientUid, setPatientUid] = useState('')
  const [uidError,   setUidError]   = useState('')

  useEffect(() => {
    api.get('/hospitals/doctor-profile/')
      .then(res => setProfile(res.data))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = () => {
    if (!patientUid.trim()) {
      setUidError('Please enter a patient UID')
      return
    }
    setUidError('')
    router.push(`/dashboard/doctor/patients/${patientUid.trim()}`)
  }

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

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '16px', marginTop: '24px',
                paddingTop: '20px', borderTop: '0.5px solid #f3f4f6'
              }}>
                {[
                  { label: 'Hospital',       value: profile.hospital_name },
                  { label: 'Department',     value: profile.department },
                  { label: 'License number', value: profile.license_number },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient search */}
            <div style={{
              background: '#fff', borderRadius: '12px',
              border: '0.5px solid #e5e7eb', padding: '28px'
            }}>
              <h2 style={{ fontSize: '17px', fontWeight: 500, marginBottom: '6px' }}>
                Add a medical record
              </h2>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
                Enter a patient's UID to view their active consent and add a record.
                The patient must have an active approved consent for your hospital.
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <input
                    value={patientUid}
                    onChange={e => setPatientUid(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g. UID3F2A9B4C1D"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '6px',
                      border: uidError ? '1.5px solid #ef4444' : '1px solid #d1d5db',
                      fontSize: '14px', boxSizing: 'border-box'
                    }}
                  />
                  {uidError && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{uidError}</p>
                  )}
                </div>
                <button onClick={handleSearch}
                  style={{
                    background: '#1a1a2e', color: '#fff', border: 'none',
                    padding: '10px 20px', borderRadius: '6px',
                    fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap'
                  }}>
                  Open patient →
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </ProtectedRoute>
  )
}
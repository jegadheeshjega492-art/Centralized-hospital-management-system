'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

interface MedicalRecord {
  id:              number
  record_type:     string
  title:           string
  hospital_name:   string
  created_by_name: string
  created_at:      string
}

interface PatientProfile {
  full_name:      string
  patient_uid:    string
  dob:            string
  gender:         string
  contact_number: string
  email:          string
  username:       string
}

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  DIAGNOSIS:         { bg: '#eff6ff', color: '#1d4ed8' },
  PRESCRIPTION:      { bg: '#f0fdf4', color: '#15803d' },
  LAB_REPORT:        { bg: '#fdf4ff', color: '#7e22ce' },
  ALLERGY:           { bg: '#fef2f2', color: '#dc2626' },
  IMMUNIZATION:      { bg: '#fff7ed', color: '#c2410c' },
  DISCHARGE_SUMMARY: { bg: '#f0f9ff', color: '#0369a1' },
  OTHER:             { bg: '#f9fafb', color: '#6b7280' },
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const router   = useRouter()
  const [records,  setRecords]  = useState<MedicalRecord[]>([])
  const [profile,  setProfile]  = useState<PatientProfile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [copied,   setCopied]   = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/records/medical-records/'),
      api.get('/auth/patient-profile/'),
    ]).then(([recordsRes, profileRes]) => {
      setRecords(recordsRes.data.slice(0, 5))
      setProfile(profileRes.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const copyUid = () => {
    if (!profile) return
    navigator.clipboard.writeText(profile.patient_uid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px' }}>

        {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}

        {!loading && profile && (
          <>
            {/* Profile card */}
            <div style={{
              background: '#fff', borderRadius: '12px',
              border: '0.5px solid #e5e7eb', padding: '24px 28px',
              marginBottom: '28px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: '#eef2ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '22px'
                  }}>
                    🧑‍⚕️
                  </div>
                  <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '2px' }}>
                      {profile.full_name}
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>@{profile.username}</p>
                  </div>
                </div>
              </div>

              {/* Patient UID — highlighted since receptionist needs it */}
             <div style={{
              background: '#f9fafb', borderRadius: '8px',
              padding: '12px 16px', marginBottom: '20px',
              border: '0.5px solid #e5e7eb'
            }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px',
                textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Patient UID — share with receptionist when booking appointment
              </p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e', letterSpacing: '1px' }}>
                {profile.patient_uid}
              </p>
            </div>

              {/* Other details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Date of birth',   value: formatDate(profile.dob) },
                  { label: 'Gender',          value: profile.gender },
                  { label: 'Contact',         value: profile.contact_number },
                  { label: 'Email',           value: profile.email },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
              {[
                { icon: '🔒', label: 'Active Access',  desc: 'See who has access',  path: '/dashboard/patient/consents' },
                { icon: '📋', label: 'All Records',    desc: 'View full history',   path: '/dashboard/patient/records' },
                { icon: '📊', label: 'Audit Trail',    desc: 'See access log',      path: '/dashboard/patient/audit' },
              ].map(action => (
                <button key={action.label} onClick={() => router.push(action.path)}
                  style={{
                    background: '#fff', border: '0.5px solid #e5e7eb',
                    borderRadius: '10px', padding: '20px 16px',
                    cursor: 'pointer', textAlign: 'left'
                  }}>
                  <p style={{ fontSize: '24px', marginBottom: '8px' }}>{action.icon}</p>
                  <p style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{action.label}</p>
                  <p style={{ color: '#6b7280', fontSize: '12px' }}>{action.desc}</p>
                </button>
              ))}
            </div>

            {/* Recent records */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 500 }}>Recent records</h2>
                <button onClick={() => router.push('/dashboard/patient/records')}
                  style={{ background: 'none', border: 'none', color: '#1a1a2e', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                  View all
                </button>
              </div>

              {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 24px', background: '#f9fafb', borderRadius: '12px', border: '0.5px solid #e5e7eb' }}>
                  <p style={{ fontSize: '28px', marginBottom: '8px' }}>📭</p>
                  <p style={{ fontWeight: 500, marginBottom: '4px' }}>No records yet</p>
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>Your records will appear here after a doctor adds them.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {records.map(record => {
                    const badge = TYPE_BADGE[record.record_type] ?? TYPE_BADGE.OTHER
                    return (
                      <div key={record.id} style={{
                        background: '#fff', borderRadius: '10px',
                        border: '0.5px solid #e5e7eb', padding: '14px 18px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{
                            ...badge, fontSize: '11px', fontWeight: 600,
                            padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap'
                          }}>
                            {record.record_type.replace('_', ' ')}
                          </span>
                          <div>
                            <p style={{ fontWeight: 500, fontSize: '14px', marginBottom: '2px' }}>{record.title}</p>
                            <p style={{ color: '#6b7280', fontSize: '12px' }}>
                              {record.hospital_name} · {record.created_by_name}
                            </p>
                          </div>
                        </div>
                        <p style={{ color: '#9ca3af', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {formatDate(record.created_at)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </ProtectedRoute>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

interface MedicalRecord {
  id:           number
  record_type:  string
  title:        string
  hospital_name: string
  created_by_name: string
  created_at:   string
}

interface PatientProfile {
  patient_uid:    string
  full_name:      string
  dob:            string
  gender:         string
  contact_number: string
}

const recordTypeColor: Record<string, { bg: string; color: string }> = {
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

  useEffect(() => {
    Promise.all([
      api.get('/records/medical-records/'),
      api.get('/auth/me/'),
    ]).then(([recordsRes]) => {
      setRecords(recordsRes.data.slice(0, 5)) // show latest 5
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Welcome header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '4px' }}>
            Welcome back, {user?.username} 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Here's a summary of your health records.
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '36px' }}>
          {[
           { icon: '🔒', label: 'Active Access', desc: 'See who has access', path: '/dashboard/patient/consents' },
            { icon: '📋', label: 'All Records',   desc: 'View full history',  path: '/dashboard/patient/records' },
            { icon: '📊', label: 'Audit Trail',   desc: 'See access log',     path: '/dashboard/patient/audit' },
          ].map(action => (
            <button key={action.label} onClick={() => router.push(action.path)}
              style={{
                background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '10px',
                padding: '20px 16px', cursor: 'pointer', textAlign: 'left'
              }}>
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>{action.icon}</p>
              <p style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{action.label}</p>
              <p style={{ color: '#6b7280', fontSize: '12px' }}>{action.desc}</p>
            </button>
          ))}
        </div>

        {/* Recent records */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 500 }}>Recent records</h2>
            <button onClick={() => router.push('/patient/records')}
              style={{ background: 'none', border: 'none', color: '#1a1a2e', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
              View all
            </button>
          </div>

          {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}

          {!loading && records.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              background: '#f9fafb', borderRadius: '12px', border: '0.5px solid #e5e7eb'
            }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>📭</p>
              <p style={{ fontWeight: 500, marginBottom: '6px' }}>No records yet</p>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Your medical records will appear here after a doctor adds them.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {records.map(record => {
              const badge = recordTypeColor[record.record_type] ?? recordTypeColor.OTHER
              return (
                <div key={record.id} style={{
                  background: '#fff', borderRadius: '10px',
                  border: '0.5px solid #e5e7eb', padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <span style={{
                      ...badge, fontSize: '11px', fontWeight: 600,
                      padding: '3px 10px', borderRadius: '20px',
                      whiteSpace: 'nowrap'
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
        </div>

      </div>
    </ProtectedRoute>
  )
}
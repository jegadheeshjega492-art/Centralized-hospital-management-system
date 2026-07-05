'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import api from '@/lib/api'

interface PrescriptionItem {
  id:          number
  tablet_name: string
  dosage:      string
  frequency:   string
  duration:    string
  notes:       string | null
}

interface MedicalRecord {
  id:                number
  record_type:       string
  title:             string
  hospital_name:     string
  created_by_name:   string
  created_at:        string
  attachment_url:    string | null
  prescription_items: PrescriptionItem[]
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

function RecordCard({ record }: { record: MedicalRecord }) {
  const [expanded, setExpanded] = useState(false)
  const badge = TYPE_BADGE[record.record_type] ?? TYPE_BADGE.OTHER
  const isPrescription = record.record_type === 'PRESCRIPTION'
  const isLabReport    = record.record_type === 'LAB_REPORT'

  return (
    <div style={{
      background: '#fff', borderRadius: '10px',
      border: '0.5px solid #e5e7eb', overflow: 'hidden'
    }}>
      {/* Main row */}
      <div style={{
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        cursor: isPrescription ? 'pointer' : 'default'
      }}
        onClick={() => isPrescription && setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <span style={{
            ...badge, fontSize: '11px', fontWeight: 600,
            padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap', marginTop: '2px'
          }}>
            {record.record_type.replace('_', ' ')}
          </span>
          <div>
            <p style={{ fontWeight: 500, fontSize: '14px', marginBottom: '3px' }}>{record.title}</p>
            <p style={{ color: '#6b7280', fontSize: '12px' }}>
              {record.hospital_name} · {record.created_by_name}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ color: '#9ca3af', fontSize: '12px' }}>
            {new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {isLabReport && record.attachment_url && (
            <a href={record.attachment_url} target="_blank" rel="noreferrer"
              style={{
                background: '#eff6ff', color: '#1d4ed8', fontSize: '12px',
                padding: '4px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: 500
              }}
              onClick={e => e.stopPropagation()}
            >
              View file
            </a>
          )}
          {isPrescription && (
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>
              {expanded ? '▲' : '▼'}
            </span>
          )}
        </div>
      </div>

      {/* Prescription expand */}
      {isPrescription && expanded && (
        <div style={{ borderTop: '0.5px solid #f3f4f6', padding: '0 20px 16px' }}>
          {record.prescription_items.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '13px', paddingTop: '12px' }}>No items found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Tablet Name', 'Dosage', 'Frequency', 'Duration'].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: 'left',
                      fontWeight: 500, color: '#6b7280', fontSize: '12px',
                      borderBottom: '0.5px solid #e5e7eb'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.prescription_items.map(item => (
                  <tr key={item.id}>
                    {[item.tablet_name, item.dosage, item.frequency, item.duration].map((val, i) => (
                      <td key={i} style={{
                        padding: '10px 12px', borderBottom: '0.5px solid #f3f4f6', color: '#374151'
                      }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get('/records/patient/')
      .then(res => setRecords(res.data))
      .catch(() => setError('Failed to load records.'))
      .finally(() => setLoading(false))
  }, [])

  // Group by hospital
  const grouped = records.reduce<Record<string, MedicalRecord[]>>((acc, r) => {
    const key = r.hospital_name
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '6px' }}>My Records</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>
          Complete medical history — read only. Click a prescription to expand medication details.
        </p>

        {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
        {error   && <p style={{ color: '#dc2626' }}>{error}</p>}

        {!loading && records.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#f9fafb', borderRadius: '12px', border: '0.5px solid #e5e7eb' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>📭</p>
            <p style={{ fontWeight: 500, marginBottom: '6px' }}>No records yet</p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Your records will appear here after a doctor adds them.</p>
          </div>
        )}

        {Object.entries(grouped).map(([hospitalName, hospitalRecords]) => (
          <div key={hospitalName} style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px' }}>🏥</span>
              <h2 style={{ fontSize: '16px', fontWeight: 500 }}>{hospitalName}</h2>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>({hospitalRecords.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {hospitalRecords.map(r => <RecordCard key={r.id} record={r} />)}
            </div>
          </div>
        ))}
      </div>
    </ProtectedRoute>
  )
}
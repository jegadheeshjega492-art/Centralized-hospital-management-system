'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import api from '@/lib/api'

interface PrescriptionRow {
  tablet_name: string
  dosage:      string
  frequency:   string
  duration:    string
  notes:       string
}

interface PrescriptionItem {
  id:          number
  tablet_name: string
  dosage:      string
  frequency:   string
  duration:    string
}

interface MedicalRecord {
  id:                 number
  record_type:        string
  title:              string
  hospital_name:      string
  created_by_name:    string
  created_at:         string
  attachment_url:     string | null
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

// ── Outside component to avoid remount bug ─────────────────
function InputField({ value, onChange, placeholder, style = {} }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  style?: React.CSSProperties
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: '6px',
        border: '1px solid #d1d5db', fontSize: '14px',
        boxSizing: 'border-box', ...style
      }}
    />
  )
}

function RecordCard({ record }: { record: MedicalRecord }) {
  const [expanded, setExpanded] = useState(false)
  const badge = TYPE_BADGE[record.record_type] ?? TYPE_BADGE.OTHER

  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '0.5px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        cursor: record.record_type === 'PRESCRIPTION' ? 'pointer' : 'default' }}
        onClick={() => record.record_type === 'PRESCRIPTION' && setExpanded(e => !e)}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ ...badge, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap', marginTop: '2px' }}>
            {record.record_type.replace('_', ' ')}
          </span>
          <div>
            <p style={{ fontWeight: 500, fontSize: '14px', marginBottom: '2px' }}>{record.title}</p>
            <p style={{ color: '#6b7280', fontSize: '12px' }}>{record.created_by_name} · {record.hospital_name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ color: '#9ca3af', fontSize: '12px' }}>
            {new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {record.record_type === 'LAB_REPORT' && record.attachment_url && (
            <a href={record.attachment_url} target="_blank" rel="noreferrer"
              style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', padding: '3px 10px', borderRadius: '6px', textDecoration: 'none' }}>
              View file
            </a>
          )}
          {record.record_type === 'PRESCRIPTION' && (
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {record.record_type === 'PRESCRIPTION' && expanded && (
        <div style={{ borderTop: '0.5px solid #f3f4f6', padding: '0 18px 14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Tablet Name', 'Dosage', 'Frequency', 'Duration'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', fontSize: '12px', borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {record.prescription_items.map(item => (
                <tr key={item.id}>
                  {[item.tablet_name, item.dosage, item.frequency, item.duration].map((v, i) => (
                    <td key={i} style={{ padding: '8px 10px', borderBottom: '0.5px solid #f3f4f6', color: '#374151' }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DoctorPatientContent() {
  const params = useParams()
  const uid = params?.uid as string

  const [hasConsent,       setHasConsent]       = useState(false)
  const [consentLoading,   setConsentLoading]   = useState(true)
  const [records,          setRecords]          = useState<MedicalRecord[]>([])
  const [recordsLoading,   setRecordsLoading]   = useState(false)
  const [recordType,       setRecordType]       = useState('DIAGNOSIS')
  const [notes,            setNotes]            = useState('')
  const [fileUrl,          setFileUrl]          = useState('')
  const [prescriptionRows, setPrescriptionRows] = useState<PrescriptionRow[]>([
    { tablet_name: '', dosage: '', frequency: '', duration: '', notes: '' }
  ])
  const [message, setMessage] = useState('')
  const [error,   setError]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Check consent
  useEffect(() => {
    if (!uid) return
    setConsentLoading(true)
    api.get(`/consent/check/?patient_uid=${uid}`)
      .then(res => setHasConsent(res.data.has_consent))
      .catch(() => setHasConsent(false))
      .finally(() => setConsentLoading(false))
  }, [uid])

  // Fetch patient history if consent exists
  useEffect(() => {
    if (!hasConsent) return
    setRecordsLoading(true)
    api.get(`/records/patient-history/?patient_uid=${uid}`)
      .then(res => setRecords(res.data))
      .catch(() => setRecords([]))
      .finally(() => setRecordsLoading(false))
  }, [hasConsent, uid])

  const addRow = () =>
    setPrescriptionRows(r => [...r, { tablet_name: '', dosage: '', frequency: '', duration: '', notes: '' }])

  const removeRow = (i: number) =>
    setPrescriptionRows(r => r.filter((_, idx) => idx !== i))

  const updateRow = (i: number, field: keyof PrescriptionRow, val: string) =>
    setPrescriptionRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const handleSubmit = async () => {
    setError(''); setMessage('')

    if (recordType === 'PRESCRIPTION') {
      if (prescriptionRows.some(r => !r.tablet_name || !r.dosage || !r.frequency || !r.duration)) {
        setError('Please fill all required prescription fields.')
        return
      }
    }

    const body: Record<string, unknown> = {
      patient_uid: uid,
      record_type: recordType,
      title: `${recordType.replace('_', ' ')} — ${new Date().toLocaleDateString('en-IN')}`,
      details: { notes },
    }
    if (recordType === 'LAB_REPORT')   body.attachment_url      = fileUrl
    if (recordType === 'PRESCRIPTION') body.prescription_items  = prescriptionRows

    setSubmitting(true)
    try {
      await api.post('/records/medical-records/', body)
      setMessage('Record added successfully!')
      setNotes(''); setFileUrl('')
      setPrescriptionRows([{ tablet_name: '', dosage: '', frequency: '', duration: '', notes: '' }])
      // Refresh history
      const res = await api.get(`/records/patient-history/?patient_uid=${uid}`)
      setRecords(res.data)
    } catch (err: any) {
      const data = err.response?.data
      if (data?.error) setError(data.error)
      else setError('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (consentLoading) return <div style={{ padding: '40px 24px' }}><p style={{ color: '#6b7280' }}>Checking consent...</p></div>

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '4px' }}>Patient: {uid}</h1>
      <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '28px' }}>
        {hasConsent ? 'Active consent verified — you can view and add records.' : 'No active consent for this patient.'}
      </p>

      {!hasConsent && (
        <div style={{ background: '#fffbeb', border: '0.5px solid #fcd34d', borderRadius: '10px', padding: '16px 20px', color: '#92400e' }}>
          ⚠️ No active consent for this patient at your hospital. Please create an appointment with OTP or manual verification first.
        </div>
      )}

      {hasConsent && (
        <>
          {/* Patient history */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 500, marginBottom: '14px' }}>
              Patient history ({records.length})
            </h2>
            {recordsLoading && <p style={{ color: '#6b7280', fontSize: '13px' }}>Loading records...</p>}
            {!recordsLoading && records.length === 0 && (
              <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '28px', textAlign: 'center', border: '0.5px solid #e5e7eb' }}>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>No records yet for this patient.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {records.map(r => <RecordCard key={r.id} record={r} />)}
            </div>
          </div>

          {/* Add record form */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e7eb', padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 500, marginBottom: '20px' }}>Add new record</h2>

            {message && (
              <div style={{ background: '#f0fdf4', color: '#15803d', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                {message}
              </div>
            )}
            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Record type</label>
              <select value={recordType} onChange={e => setRecordType(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                <option value="DIAGNOSIS">Diagnosis</option>
                <option value="LAB_REPORT">Lab Report</option>
                <option value="ALLERGY">Allergy</option>
                <option value="IMMUNIZATION">Immunization</option>
                <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                <option value="PRESCRIPTION">Prescription</option>
              </select>
            </div>

            {['DIAGNOSIS', 'ALLERGY', 'IMMUNIZATION', 'DISCHARGE_SUMMARY'].includes(recordType) && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                  placeholder="Enter clinical notes..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            )}

            {recordType === 'LAB_REPORT' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>File URL</label>
                <InputField value={fileUrl} onChange={setFileUrl} placeholder="Paste file URL (S3/MinIO link)" />
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>File upload via S3 will be added in the next phase.</p>
              </div>
            )}

            {recordType === 'PRESCRIPTION' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Medications</label>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Tablet Name', 'Dosage', 'Frequency', 'Duration', 'Notes', ''].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', fontSize: '12px', borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptionRows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                          {(['tablet_name', 'dosage', 'frequency', 'duration', 'notes'] as (keyof PrescriptionRow)[]).map(field => (
                            <td key={field} style={{ padding: '6px' }}>
                              <input
                                value={row[field]}
                                onChange={e => updateRow(i, field, e.target.value)}
                                placeholder={field.replace('_', ' ')}
                                style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid #d1d5db', fontSize: '13px' }}
                              />
                            </td>
                          ))}
                          <td style={{ padding: '6px' }}>
                            <button onClick={() => removeRow(i)} disabled={prescriptionRows.length === 1}
                              style={{ background: prescriptionRows.length === 1 ? '#e5e7eb' : '#fef2f2',
                                color: prescriptionRows.length === 1 ? '#9ca3af' : '#dc2626',
                                border: 'none', borderRadius: '5px', padding: '6px 10px', cursor: prescriptionRows.length === 1 ? 'not-allowed' : 'pointer' }}>
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={addRow}
                  style={{ marginTop: '10px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px' }}>
                  + Add row
                </button>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting}
              style={{ background: submitting ? '#9ca3af' : '#1a1a2e', color: '#fff', border: 'none', borderRadius: '6px',
                padding: '10px 22px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '14px', marginTop: '8px' }}>
              {submitting ? 'Saving...' : 'Submit record'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function DoctorPatientPage() {
  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <DoctorPatientContent />
    </ProtectedRoute>
  )
}
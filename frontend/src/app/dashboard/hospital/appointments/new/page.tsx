'use client';
import api from '@/lib/api'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

// ── Field moved OUTSIDE the page component ──────────────
function Field({ label, name, type = 'text', placeholder = '', value, onChange, error }: {
  label: string; name: string; type?: string; placeholder?: string;
  value: string; onChange: (val: string) => void; error?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: '6px',
          border: error ? '1.5px solid #ef4444' : '1px solid #d1d5db',
          fontSize: '14px', boxSizing: 'border-box'
        }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
    </div>
  )
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp' | 'manual'>('form');
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const [manualChecked, setManualChecked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    patient_uid: '', doctor: '', hospital: '',
    appointment_date: '', start_time: '', end_time: '',
    access_method: 'OTP',
  });

  const setField = (name: string) => (val: string) => setForm(f => ({ ...f, [name]: val }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.patient_uid)          e.patient = 'Patient UID is required'
    if (!form.doctor)           e.doctor = 'Doctor ID is required'
    if (!form.hospital)         e.hospital = 'Hospital ID is required'
    if (!form.appointment_date) e.appointment_date = 'Date is required'
    if (!form.start_time)       e.start_time = 'Start time is required'
    if (!form.end_time)         e.end_time = 'End time is required'
    if (form.start_time && form.end_time && form.end_time <= form.start_time)
      e.end_time = 'End time must be after start time'
    return e
  }

  const parseDjangoErrors = (data: Record<string, unknown>) => {
    const e: Record<string, string> = {}
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val)) e[key] = val.join(' ')
      else if (typeof val === 'string') e[key] = val
      else e[key] = JSON.stringify(val)
    }
    return e
  }

const handleFormSubmit = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await api.post('/consent/appointments/', form)
      setAppointmentId(res.data.id)
      setStep(form.access_method === 'OTP' ? 'otp' : 'manual')
    } catch (err: any) {
      if (err.response?.data) setErrors(parseDjangoErrors(err.response.data))
      else setErrors({ general: 'Something went wrong. Is the Django server running?' })
    } finally {
      setLoading(false)
    }
  }

const handleOTPVerify = async () => {
    if (!otp || otp.length !== 6) { setErrors({ otp: 'Please enter the 6-digit OTP' }); return }
    setErrors({})
    setLoading(true)
    try {
      await api.post(`/consent/appointments/${appointmentId}/verify-otp/`, { otp })
      setSuccess('Access granted successfully!')
    } catch (err: any) {
      setErrors({ otp: err.response?.data?.error || 'OTP verification failed' })
    } finally { setLoading(false) }
  }

const handleManualVerify = async () => {
    setErrors({})
    setLoading(true)
    try {
      await api.post(`/consent/appointments/${appointmentId}/verify-manual/`)
      setSuccess('Access granted successfully!')
    } catch {
      setErrors({ general: 'Manual verification failed' })
    } finally { setLoading(false) }
  }

  const btnStyle = (disabled = false): React.CSSProperties => ({
    width: '100%', padding: '10px', border: 'none', borderRadius: '6px',
    fontSize: '15px', cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#9ca3af' : '#1a1a2e', color: '#fff', marginTop: '16px'
  })

  return (
    <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
      {success ? (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f0fdf4', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '22px', color: '#16a34a', fontWeight: 600, marginBottom: '16px' }}> {success}</p>
            <button onClick={() => router.push('/dashboard/hospital')} style={{ ...btnStyle(), marginTop: 0, width: 'auto', padding: '10px 24px' }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '480px', border: '0.5px solid #e2e8f0' }}>

            {step === 'form' && (
              <>
                <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '24px' }}>New Appointment</h1>
                {errors.general && (
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
                    {errors.general}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Field label="Patient UID" name="patient_uid" placeholder="e.g. UID3F2A9B4C1D"
                    value={form.patient_uid} onChange={setField('patient_uid')} error={errors.patient_uid} />
                  <Field label="Doctor ID" name="doctor"
                    value={form.doctor} onChange={setField('doctor')} error={errors.doctor} />
                  <Field label="Hospital ID" name="hospital"
                    value={form.hospital} onChange={setField('hospital')} error={errors.hospital} />
                  <Field label="Appointment Date" name="appointment_date" type="date"
                    value={form.appointment_date} onChange={setField('appointment_date')} error={errors.appointment_date} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Field label="Start Time" name="start_time" type="time"
                      value={form.start_time} onChange={setField('start_time')} error={errors.start_time} />
                    <Field label="End Time" name="end_time" type="time"
                      value={form.end_time} onChange={setField('end_time')} error={errors.end_time} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Access Method</label>
                    <select value={form.access_method} onChange={e => setField('access_method')(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                      <option value="OTP">OTP Verification</option>
                      <option value="MANUAL">Manual Verification</option>
                    </select>
                  </div>
                  <button onClick={handleFormSubmit} disabled={loading} style={btnStyle(loading)}>
                    {loading ? 'Creating...' : 'Create Appointment'}
                  </button>
                </div>
              </>
            )}

            {step === 'otp' && (
              <>
                <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '8px' }}>OTP Verification</h1>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                  OTP has been sent to the patient. Ask them for it.
                </p>
                <input placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', fontSize: '22px',
                    letterSpacing: '8px', textAlign: 'center', boxSizing: 'border-box',
                    border: errors.otp ? '1.5px solid #ef4444' : '1px solid #d1d5db' }} />
                {errors.otp && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.otp}</p>}
                <button onClick={handleOTPVerify} disabled={loading} style={btnStyle(loading)}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </>
            )}

            {step === 'manual' && (
              <>
                <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '24px' }}>Manual Verification</h1>
                {errors.general && (
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
                    {errors.general}
                  </div>
                )}
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '24px' }}>
                  <input type="checkbox" checked={manualChecked} onChange={e => setManualChecked(e.target.checked)}
                    style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                    I have verified the patient's name and date of birth against a government-issued ID.
                  </span>
                </label>
                <button onClick={handleManualVerify} disabled={!manualChecked || loading} style={btnStyle(!manualChecked || loading)}>
                  {loading ? 'Confirming...' : 'Confirm Verification'}
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
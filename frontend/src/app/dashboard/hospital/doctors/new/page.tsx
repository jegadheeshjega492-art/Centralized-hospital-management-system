'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import api from '@/lib/api'

// ── Move Field OUTSIDE the page component ──────────────────
function Field({ label, type = 'text', value, onChange, error }: {
  label: string; type?: string;
  value: string; onChange: (val: string) => void; error?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#374151' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: '6px', fontSize: '14px',
          border: error ? '1.5px solid #ef4444' : '1px solid #d1d5db',
          boxSizing: 'border-box'
        }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
    </div>
  )
}

export default function NewDoctorPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    first_name: '', last_name: '',
    license_number: '', department: '',
  })
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const setField = (name: string) => (val: string) =>
    setForm(f => ({ ...f, [name]: val }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.first_name)     e.first_name     = 'First name is required'
    if (!form.last_name)      e.last_name      = 'Last name is required'
    if (!form.username)       e.username       = 'Username is required'
    if (!form.email)          e.email          = 'Email is required'
    if (!form.password || form.password.length < 8)
                              e.password       = 'Password must be at least 8 characters'
    if (!form.license_number) e.license_number = 'License number is required'
    if (!form.department)     e.department     = 'Department is required'
    return e
  }

  const handleSubmit = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setErrors({})
    setLoading(true)
    try {
      await api.post('/hospitals/doctors/create/', form)
      setSuccess(true)
    } catch (err: any) {
      if (err.response?.data) {
        const e: Record<string, string> = {}
        for (const [key, val] of Object.entries(err.response.data)) {
          e[key] = Array.isArray(val) ? (val as string[]).join(' ') : String(val)
        }
        setErrors(e)
      } else {
        setErrors({ general: 'Something went wrong.' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '48px', background: '#f0fdf4', borderRadius: '12px' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>✅</p>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#15803d', marginBottom: '8px' }}>
              Doctor account created
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              They can now log in and will appear on your dashboard after verification.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => router.push('/dashboard/hospital')}
                style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
                Back to dashboard
              </button>
              <button onClick={() => {
                setSuccess(false)
                setForm({ username: '', email: '', password: '', first_name: '', last_name: '', license_number: '', department: '' })
              }}
                style={{ background: '#fff', color: '#1a1a2e', border: '1px solid #d1d5db', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
                Add another
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 24px' }}>
        <button onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>
          ← Back
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '8px' }}>Add a doctor</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '28px' }}>
          This creates a login account for the doctor linked to your hospital.
        </p>

        {errors.general && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
            {errors.general}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="First name" value={form.first_name} onChange={setField('first_name')} error={errors.first_name} />
            <Field label="Last name"  value={form.last_name}  onChange={setField('last_name')}  error={errors.last_name} />
          </div>
          <Field label="Username"       value={form.username}       onChange={setField('username')}       error={errors.username} />
          <Field label="Email"          value={form.email}          onChange={setField('email')}          error={errors.email} type="email" />
          <Field label="Password"       value={form.password}       onChange={setField('password')}       error={errors.password} type="password" />
          <Field label="License number" value={form.license_number} onChange={setField('license_number')} error={errors.license_number} />
          <Field label="Department"     value={form.department}     onChange={setField('department')}     error={errors.department} />

          <button onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', padding: '11px',
              background: loading ? '#9ca3af' : '#1a1a2e',
              color: '#fff', border: 'none', borderRadius: '6px',
              fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px'
            }}>
            {loading ? 'Creating...' : 'Create doctor account'}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

export default function PatientRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username:       '',
    email:          '',
    password:       '',
    full_name:      '',
    dob:            '',
    gender:         '',
    contact_number: '',
    aadhaar_number: '',
  })
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/register/patient/', form)
      setSuccess(`Registered! Your Patient ID: ${res.data.user.id}. Please login.`)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      const data = err.response?.data
      // Show first error message from DRF
      const msg = data ? Object.values(data).flat().join(' ') : 'Registration failed.'
      setError(msg as string)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Patient Registration</h2>

        {error   && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { label: 'Username',       name: 'username',       type: 'text' },
            { label: 'Email',          name: 'email',          type: 'email' },
            { label: 'Password',       name: 'password',       type: 'password' },
            { label: 'Full Name',      name: 'full_name',      type: 'text' },
            { label: 'Date of Birth',  name: 'dob',            type: 'date' },
            { label: 'Contact Number', name: 'contact_number', type: 'tel' },
            { label: 'Aadhaar Number (12 digits)', name: 'aadhaar_number', type: 'text' },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label style={styles.label}>{label}</label>
              <input
                name={name}
                type={type}
                value={(form as any)[name]}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          ))}

          <div>
            <label style={styles.label}>Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} required style={styles.input}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', justifyContent: 'center', padding: '40px 16px' },
  card:      { background: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '480px' },
  title:     { marginBottom: '20px', textAlign: 'center' },
  form:      { display: 'flex', flexDirection: 'column', gap: '12px' },
  label:     { fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '4px' },
  input:     { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  button:    { padding: '10px', backgroundColor: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', marginTop: '8px' },
  error:     { color: 'red', fontSize: '13px', marginBottom: '8px' },
  success:   { color: 'green', fontSize: '13px', marginBottom: '8px' },
  footer:    { textAlign: 'center', marginTop: '16px', fontSize: '13px' },
}
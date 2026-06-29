'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

export default function HospitalRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name:                '',
    registration_number: '',
    contact_email:       '',
    address:             '',
    // password for the admin account
    username:            '',
    password:            '',
  })
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // TODO: update this URL once Person 2 merges her hospital register endpoint
      await api.post('/hospitals/register/', form)
      setSuccess('Hospital registered! Pending verification. Please login.')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      const data = err.response?.data
      const msg = data ? Object.values(data).flat().join(' ') : 'Registration failed.'
      setError(msg as string)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Hospital Registration</h2>
        <p style={styles.subtitle}>
          After registration, an admin will verify your hospital before you can log in.
        </p>

        {error   && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { label: 'Hospital Name',        name: 'name',                type: 'text' },
            { label: 'Registration Number',  name: 'registration_number', type: 'text' },
            { label: 'Contact Email',        name: 'contact_email',       type: 'email' },
            { label: 'Address',              name: 'address',             type: 'text' },
            { label: 'Admin Username',       name: 'username',            type: 'text' },
            { label: 'Admin Password',       name: 'password',            type: 'password' },
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

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Submitting...' : 'Register Hospital'}
          </button>
        </form>

        <p style={styles.footer}>
          Already registered? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', justifyContent: 'center', padding: '40px 16px' },
  card:      { background: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '480px' },
  title:     { marginBottom: '8px', textAlign: 'center' },
  subtitle:  { fontSize: '13px', color: '#666', textAlign: 'center', marginBottom: '20px' },
  form:      { display: 'flex', flexDirection: 'column', gap: '12px' },
  label:     { fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '4px' },
  input:     { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  button:    { padding: '10px', backgroundColor: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', marginTop: '8px' },
  error:     { color: 'red', fontSize: '13px', marginBottom: '8px' },
  success:   { color: 'green', fontSize: '13px', marginBottom: '8px' },
  footer:    { textAlign: 'center', marginTop: '16px', fontSize: '13px' },
}
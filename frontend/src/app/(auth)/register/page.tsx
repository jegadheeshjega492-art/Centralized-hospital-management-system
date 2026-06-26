'use client'
import { useRouter } from 'next/navigation'

export default function RegisterLanding() {
  const router = useRouter()
  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '8px' }}>Create an account</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>Select your role to get started</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Patient', icon: '👤', path: '/register/patient' },
          { label: 'Hospital', icon: '🏥', path: '/register/hospital' },
        ].map((r) => (
          <button key={r.label} onClick={() => router.push(r.path)}
            style={{ padding: '24px 16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{r.icon}</div>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
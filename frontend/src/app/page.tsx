import Link from 'next/link'

export default function Home() {
  return (
    <>
      <section style={{ background: '#f8fafc', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 500, color: '#1a1a2e', marginBottom: '12px' }}>
          Your health records,<br />always with you
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '440px', margin: '0 auto 32px', lineHeight: 1.7 }}>
          Secure, centralised medical records shared between patients, doctors, and hospitals — with your consent.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/register/patient" style={{ background: '#1a1a2e', color: '#fff', padding: '11px 24px', borderRadius: '6px', fontSize: '14px', textDecoration: 'none' }}>
            Register as patient
          </Link>
          <Link href="/register/hospital" style={{ border: '1.5px solid #1a1a2e', color: '#1a1a2e', padding: '11px 24px', borderRadius: '6px', fontSize: '14px', textDecoration: 'none' }}>
            For hospitals
          </Link>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid #e2e8f0', marginTop: '0' }}>
        {[
          { icon: '🔒', title: 'Consent-first', desc: 'Doctors can only access your records after you approve each request.' },
          { icon: '📋', title: 'Complete history', desc: 'All prescriptions, diagnoses and visits — in one place, forever.' },
          { icon: '🏥', title: 'Multi-hospital', desc: 'Works across hospitals. Your data follows you, not the other way around.' },
        ].map((f) => (
          <div key={f.title} style={{ padding: '28px 24px', borderRight: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
            <h3 style={{ fontSize: '15px', fontWeight: 500, marginBottom: '8px' }}>{f.title}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </>
  )
}
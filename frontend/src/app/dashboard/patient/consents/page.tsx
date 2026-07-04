'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import api from '@/lib/api';

interface ConsentRequest {
  id: number;
  hospital_name: string;
  doctor_name: string;
  consent_method: string;
  expires_at: string;
  resolved_at: string;
}

export default function PatientConsentsPage() {
  const [consents, setConsents] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConsents = useCallback(async () => {
    try {
      const res = await api.get('/consent/request/')
      setConsents(res.data)
    } catch {
      setError('Failed to load active access list.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConsents() }, [fetchConsents])

  const methodLabel = (method: string) => {
    if (method === 'RECEPTIONIST_OTP')    return 'OTP Verified'
    if (method === 'RECEPTIONIST_MANUAL') return 'Manually Verified'
    return method
  }

  const methodColor = (method: string) => {
    if (method === 'RECEPTIONIST_OTP')    return { background: '#eff6ff', color: '#1d4ed8' }
    if (method === 'RECEPTIONIST_MANUAL') return { background: '#f0fdf4', color: '#15803d' }
    return {}
  }

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '8px' }}>
          Active Hospital Access
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>
          These hospitals currently have access to your medical records.
          Access expires automatically after your appointment ends.
        </p>

        {loading && (
          <p style={{ color: '#6b7280' }}>Loading...</p>
        )}

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {!loading && consents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#f9fafb', borderRadius: '12px', border: '0.5px solid #e5e7eb' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</p>
            <p style={{ fontWeight: 500, marginBottom: '6px' }}>No active access</p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              No hospital currently has access to your records.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {consents.map(c => (
            <div key={c.id} style={{
              background: '#fff', borderRadius: '12px',
              border: '0.5px solid #e5e7eb',
              padding: '20px 24px',
              borderLeft: '4px solid #16a34a'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '16px', marginBottom: '4px' }}>
                    {c.hospital_name}
                  </p>
                  <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '8px' }}>
                    {c.doctor_name}
                  </p>
                  <span style={{
                    ...methodColor(c.consent_method),
                    fontSize: '12px', fontWeight: 500,
                    padding: '3px 10px', borderRadius: '20px',
                    display: 'inline-block'
                  }}>
                    {methodLabel(c.consent_method)}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Access expires</p>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#dc2626' }}>
                    {new Date(c.expires_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
}
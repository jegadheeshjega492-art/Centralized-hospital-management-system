'use client';

import { useState, useEffect, useCallback } from 'react';

interface ConsentRequest {
  id: number;
  hospital_name: string;
  doctor_name: string;
  requested_at: string;
  status: string;
  expires_at: string;
}

export default function PatientConsentsPage() {
  const [pending, setPending] = useState<ConsentRequest[]>([]);
  const [active, setActive] = useState<ConsentRequest[]>([]);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('access') || '');
  }, []);

  const fetchConsents = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/consent/request/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPending(data.filter((c: ConsentRequest) => c.status === 'PENDING'));
      setActive(data.filter((c: ConsentRequest) => c.status === 'APPROVED'));
    } catch {
      setMessage('Failed to load consents');
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchConsents();
  }, [token, fetchConsents]);

  const handleAction = async (id: number, action: 'approve' | 'deny') => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/consent/${id}/${action}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage(`Consent ${action}d successfully!`);
        fetchConsents();
      } else {
        setMessage('Action failed!');
      }
    } catch {
      setMessage('Something went wrong!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px' }}>
        My Consent Requests
      </h1>

      {message && (
        <div style={{
          background: '#dbeafe', color: '#1e40af',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '24px'
        }}>
          {message}
        </div>
      )}

      {/* Pending Requests */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Pending Requests
        </h2>
        {pending.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No pending consent requests.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pending.map(c => (
              <div key={c.id} style={{
                background: 'white', borderRadius: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                padding: '24px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '18px' }}>{c.hospital_name}</p>
                  <p style={{ color: '#4b5563' }}>Dr. {c.doctor_name}</p>
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                    Requested: {new Date(c.requested_at).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleAction(c.id, 'approve')}
                    style={{
                      background: '#16a34a', color: 'white',
                      padding: '8px 16px', borderRadius: '8px',
                      border: 'none', cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(c.id, 'deny')}
                    style={{
                      background: '#ef4444', color: 'white',
                      padding: '8px 16px', borderRadius: '8px',
                      border: 'none', cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Access */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Currently Active Access
        </h2>
        {active.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No active consents.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {active.map(c => (
              <div key={c.id} style={{
                background: 'white', borderRadius: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                padding: '24px', borderLeft: '4px solid #16a34a'
              }}>
                <p style={{ fontWeight: '600', fontSize: '18px' }}>{c.hospital_name}</p>
                <p style={{ color: '#4b5563' }}>Dr. {c.doctor_name}</p>
                <p style={{ color: '#16a34a', fontSize: '14px', marginTop: '4px' }}>
                  Access expires: {new Date(c.expires_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
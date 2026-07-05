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
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">My Consent Requests</h1>

      {message && (
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded mb-6">
          {message}
        </div>
      )}

      {/* Pending Requests */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
        {pending.length === 0 ? (
          <p className="text-gray-500">No pending consent requests.</p>
        ) : (
          <div className="space-y-4">
            {pending.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{c.hospital_name}</p>
                  <p className="text-gray-600">Dr. {c.doctor_name}</p>
                  <p className="text-gray-400 text-sm">
                    Requested: {new Date(c.requested_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(c.id, 'approve')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(c.id, 'deny')}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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
        <h2 className="text-xl font-semibold mb-4">Currently Active Access</h2>
        {active.length === 0 ? (
          <p className="text-gray-500">No active consents.</p>
        ) : (
          <div className="space-y-4">
            {active.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
                <p className="font-semibold text-lg">{c.hospital_name}</p>
                <p className="text-gray-600">Dr. {c.doctor_name}</p>
                <p className="text-green-600 text-sm mt-1">
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
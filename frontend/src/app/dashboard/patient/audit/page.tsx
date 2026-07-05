'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import api from '@/lib/api'

interface AuditLog {
  id:            number
  action:        string
  actor_name:    string
  hospital_name: string
  timestamp:     string
  metadata:      { record_type?: string; record_id?: number } | null
}

const ACTION_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  ADD_RECORD:  { label: 'Added a record',  icon: '📝', color: '#15803d' },
  VIEW_RECORD: { label: 'Viewed records',  icon: '👁️', color: '#1d4ed8' },
}

export default function AuditTrailPage() {
  const [logs,    setLogs]    = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get('/audit/')
      .then(res => setLogs(res.data))
      .catch(() => setError('Failed to load audit trail.'))
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (t: string) =>
    new Date(t).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '6px' }}>Audit Trail</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>
          Every access to your records is logged here. Read-only.
        </p>

        {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
        {error   && <p style={{ color: '#dc2626' }}>{error}</p>}

        {!loading && logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#f9fafb', borderRadius: '12px', border: '0.5px solid #e5e7eb' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</p>
            <p style={{ fontWeight: 500, marginBottom: '6px' }}>No activity yet</p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Access events will appear here once doctors interact with your records.</p>
          </div>
        )}

        {/* Timeline */}
        <div style={{ position: 'relative' }}>
          {logs.map((log, index) => {
            const action = ACTION_LABEL[log.action] ?? { label: log.action, icon: '📌', color: '#6b7280' }
            return (
              <div key={log.id} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>

                {/* Timeline dot + line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#f9fafb', border: '0.5px solid #e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', flexShrink: 0
                  }}>
                    {action.icon}
                  </div>
                  {index < logs.length - 1 && (
                    <div style={{ width: '1px', flexGrow: 1, background: '#e5e7eb', marginTop: '4px' }} />
                  )}
                </div>

                {/* Content */}
                <div style={{
                  background: '#fff', borderRadius: '10px',
                  border: '0.5px solid #e5e7eb', padding: '14px 18px',
                  flex: 1, marginBottom: index < logs.length - 1 ? '0' : '0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '14px', color: action.color, marginBottom: '4px' }}>
                        {action.label}
                      </p>
                      <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '2px' }}>
                        {log.actor_name}
                        {log.hospital_name && (
                          <span style={{ color: '#9ca3af' }}> · {log.hospital_name}</span>
                        )}
                      </p>
                      {log.metadata?.record_type && (
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {log.metadata.record_type.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {formatTime(log.timestamp)}
                    </p>
                  </div>
                </div>

              </div>
            )
          })}
        </div>

      </div>
    </ProtectedRoute>
  )
}
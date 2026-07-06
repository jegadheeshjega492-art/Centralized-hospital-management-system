'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

interface PrescriptionRow {
  tablet_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

function DoctorPatientContent() {
  const params = useParams();
  const uid = params?.uid as string;

  const [hasConsent, setHasConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [recordType, setRecordType] = useState('DIAGNOSIS');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [prescriptionRows, setPrescriptionRows] = useState<PrescriptionRow[]>([
    { tablet_name: '', dosage: '', frequency: '', duration: '', notes: '' }
  ]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const addRow = () => {
    setPrescriptionRows([...prescriptionRows, { tablet_name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
  };

  const removeRow = (index: number) => {
    if (prescriptionRows.length === 1) return;
    setPrescriptionRows(prescriptionRows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof PrescriptionRow, value: string) => {
    const updated = [...prescriptionRows];
    updated[index][field] = value;
    setPrescriptionRows(updated);
  };

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    const token = localStorage.getItem('access') || '';

    if (recordType === 'PRESCRIPTION') {
      if (prescriptionRows.length === 0) {
        setError('Minimum 1 prescription row required!');
        return;
      }
      const empty = prescriptionRows.some(r => !r.tablet_name || !r.dosage || !r.frequency || !r.duration);
      if (empty) {
        setError('Please fill all required prescription fields!');
        return;
      }
    }

    const body: Record<string, unknown> = {
      patient_uid: uid,
      record_type: recordType,
      title: `${recordType} - ${new Date().toLocaleDateString()}`,
      details: { notes },
    };

    if (recordType === 'LAB_REPORT') body.attachment_url = fileUrl;
    if (recordType === 'PRESCRIPTION') body.prescription_items = prescriptionRows;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/records/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data));
        return;
      }
      setMessage('Record added successfully! ✅');
      setNotes('');
      setFileUrl('');
      setPrescriptionRows([{ tablet_name: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    } catch {
      setError('Something went wrong!');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        Patient: {uid}
      </h1>

      {!hasConsent && (
        <div style={{
          background: '#fef3c7', border: '1px solid #f59e0b',
          borderRadius: '8px', padding: '16px', marginBottom: '24px', color: '#92400e'
        }}>
          ⚠️ No active consent for this patient. Please request consent first.
        </div>
      )}

      {hasConsent && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Add New Record</h2>

          {message && (
            <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Record Type</label>
            <select
              value={recordType}
              onChange={e => setRecordType(e.target.value)}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }}
            >
              <option value="DIAGNOSIS">Diagnosis</option>
              <option value="LAB_REPORT">Lab Report</option>
              <option value="ALLERGY">Allergy</option>
              <option value="IMMUNIZATION">Immunization</option>
              <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
              <option value="PRESCRIPTION">Prescription</option>
            </select>
          </div>

          {['DIAGNOSIS', 'ALLERGY', 'IMMUNIZATION', 'DISCHARGE_SUMMARY'].includes(recordType) && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }}
                placeholder="Enter notes..."
              />
            </div>
          )}

          {recordType === 'LAB_REPORT' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>File URL</label>
              <input
                value={fileUrl}
                onChange={e => setFileUrl(e.target.value)}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }}
                placeholder="Enter file URL..."
              />
            </div>
          )}

          {recordType === 'PRESCRIPTION' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '12px' }}>Medications</label>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      {['Tablet Name', 'Dosage', 'Frequency', 'Duration', 'Notes', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionRows.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        {(['tablet_name', 'dosage', 'frequency', 'duration', 'notes'] as (keyof PrescriptionRow)[]).map(field => (
                          <td key={field} style={{ padding: '8px' }}>
                            <input
                              value={row[field]}
                              onChange={e => updateRow(index, field, e.target.value)}
                              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 8px', fontSize: '14px' }}
                              placeholder={field.replace('_', ' ')}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '8px' }}>
                          <button
                            onClick={() => removeRow(index)}
                            disabled={prescriptionRows.length === 1}
                            style={{
                              background: prescriptionRows.length === 1 ? '#d1d5db' : '#ef4444',
                              color: 'white', border: 'none', borderRadius: '6px',
                              padding: '6px 10px', cursor: prescriptionRows.length === 1 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addRow}
                style={{ marginTop: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}
              >
                + Add Row
              </button>
            </div>
          )}

          <button
            onClick={handleSubmit}
            style={{ background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: '600' }}
          >
            Submit Record
          </button>
        </div>
      )}
    </div>
  );
}

export default function DoctorPatientPage() {
  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <DoctorPatientContent />
    </ProtectedRoute>
  );
}
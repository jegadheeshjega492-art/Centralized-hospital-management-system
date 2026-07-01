'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp' | 'manual'>('form');
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const [manualChecked, setManualChecked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    patient: '',
    doctor: '',
    hospital: '',
    appointment_date: '',
    start_time: '',
    end_time: '',
    access_method: 'OTP',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('access') : '';

  const handleFormSubmit = async () => {
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/consent/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data));
        return;
      }

      setAppointmentId(data.id);
      if (form.access_method === 'OTP') {
        setStep('otp');
      } else {
        setStep('manual');
      }
    } catch {
      setError('Something went wrong!');
    }
  };

  const handleOTPVerify = async () => {
    setError('');
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/consent/appointments/${appointmentId}/verify-otp/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'OTP verification failed');
        return;
      }
      setSuccess('Access granted successfully!');
    } catch {
      setError('Something went wrong!');
    }
  };

  const handleManualVerify = async () => {
    setError('');
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/consent/appointments/${appointmentId}/verify-manual/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError('Manual verification failed');
        return;
      }
      setSuccess('Access granted successfully!');
    } catch {
      setError('Something went wrong!');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">✅ {success}</h2>
          <button
            onClick={() => router.push('/dashboard/hospital')}
            className="bg-black text-white px-6 py-2 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-lg">

        {/* STEP 1 — Form */}
        {step === 'form' && (
          <>
            <h1 className="text-2xl font-bold mb-6">New Appointment</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient UID</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter patient UID"
                  value={form.patient}
                  onChange={e => setForm({ ...form, patient: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Doctor ID</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter doctor ID"
                  value={form.doctor}
                  onChange={e => setForm({ ...form, doctor: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hospital ID</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter hospital ID"
                  value={form.hospital}
                  onChange={e => setForm({ ...form, hospital: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Appointment Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.appointment_date}
                  onChange={e => setForm({ ...form, appointment_date: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full border rounded px-3 py-2"
                    value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full border rounded px-3 py-2"
                    value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Access Method</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.access_method}
                  onChange={e => setForm({ ...form, access_method: e.target.value })}
                >
                  <option value="OTP">OTP Verification</option>
                  <option value="MANUAL">Manual Verification</option>
                </select>
              </div>

              <button
                onClick={handleFormSubmit}
                className="w-full bg-black text-white py-2 rounded mt-2"
              >
                Create Appointment
              </button>
            </div>
          </>
        )}

        {/* STEP 2 — OTP */}
        {step === 'otp' && (
          <>
            <h1 className="text-2xl font-bold mb-4">OTP Verification</h1>
            <p className="text-gray-600 mb-6">
              OTP has been sent to patient. Ask the patient for it.
            </p>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <input
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={6}
            />
            <button
              onClick={handleOTPVerify}
              className="w-full bg-black text-white py-2 rounded"
            >
              Verify OTP
            </button>
          </>
        )}

        {/* STEP 3 — Manual */}
        {step === 'manual' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Manual Verification</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                id="manual-check"
                checked={manualChecked}
                onChange={e => setManualChecked(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="manual-check" className="text-gray-700">
                I have verified the patient's name and date of birth against a government ID.
              </label>
            </div>
            <button
              onClick={handleManualVerify}
              disabled={!manualChecked}
              className={`w-full py-2 rounded text-white ${
                manualChecked ? 'bg-black' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm
            </button>
          </>
        )}

      </div>
    </div>
  );
}
'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav style={styles.nav}>
      <Link href="/" style={styles.brand}>HealthRecord</Link>

      <div style={styles.links}>
        {/* No one logged in */}
        {!user && (
          <>
            <Link href="/login"    style={styles.link}>Login</Link>
            <Link href="/register" style={styles.link}>Register</Link>
          </>
        )}

        {/* Patient links */}
        {user?.role === 'PATIENT' && (
          <>
            <Link href="/patient/dashboard" style={styles.link}>Dashboard</Link>
            <Link href="/patient/records"   style={styles.link}>My Records</Link>
            <Link href="/patient/appointments" style={styles.link}>Appointments</Link>
          </>
        )}

        {/* Doctor links */}
        {user?.role === 'DOCTOR' && (
          <>
            <Link href="/hospital/dashboard" style={styles.link}>Dashboard</Link>
            <Link href="/doctor/patients"    style={styles.link}>My Patients</Link>
          </>
        )}

        {/* Hospital Admin links */}
        {user?.role === 'HOSPITAL_ADMIN' && (
          <>
            <Link href="/hospital/dashboard" style={styles.link}>Dashboard</Link>
            <Link href="/hospital/doctors"   style={styles.link}>Manage Doctors</Link>
          </>
        )}

        {/* Show username + logout when logged in */}
        {user && (
          <div style={styles.userSection}>
            <span style={styles.username}>Hi, {user.username}</span>
            <button onClick={logout} style={styles.logoutBtn}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  )
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '12px 24px',
    backgroundColor: '#1a1a2e',
    color:           '#fff',
  },
  brand: {
    color:          '#fff',
    textDecoration: 'none',
    fontWeight:     'bold',
    fontSize:       '18px',
  },
  links: {
    display:    'flex',
    alignItems: 'center',
    gap:        '16px',
  },
  link: {
    color:          '#ccc',
    textDecoration: 'none',
    fontSize:       '14px',
  },
  userSection: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  username: {
    fontSize: '14px',
    color:    '#aaa',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border:          '1px solid #ccc',
    color:           '#ccc',
    padding:         '4px 10px',
    borderRadius:    '4px',
    cursor:          'pointer',
    fontSize:        '13px',
  },
}
import { useState } from 'react'
import './AddUser.css'

function AddUser() {
  const [name, setName]               = useState('')
  const [passcode, setPasscode]       = useState('')
  const [adminSecret, setAdminSecret] = useState('')
  const [status, setStatus]           = useState(null)
  // null | 'loading' | { success: bool, message: string }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), passcode, adminSecret }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus({ success: true, message: `"${data.name}" was added. They can now log in.` })
        setName('')
        setPasscode('')
        setAdminSecret('')
      } else {
        setStatus({ success: false, message: data.error || 'Failed to add user.' })
      }
    } catch {
      setStatus({ success: false, message: 'Could not connect to the server.' })
    }
  }

  return (
    <div className="add-user-page">
      <div className="add-user-card">
        <div className="add-user-logo">
          <span className="add-user-logo-icon">⚡</span>
          <h1>Add User</h1>
          <p>Create a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="add-user-form">
          <div className="form-group">
            <label htmlFor="au-name">Full Name</label>
            <input
              id="au-name"
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setStatus(null) }}
              placeholder="e.g. John Doe"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="au-passcode">4-Digit Passcode</label>
            <input
              id="au-passcode"
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="au-secret">Admin Secret</label>
            <input
              id="au-secret"
              type="password"
              value={adminSecret}
              onChange={e => setAdminSecret(e.target.value)}
              placeholder="Admin secret"
              required
            />
            <span className="form-hint">
              Set <code>ADMIN_SECRET</code> in Netlify → Site Settings → Environment Variables.
              In dev it defaults to <code>admin</code>.
            </span>
          </div>

          {status && status !== 'loading' && (
            <p className={`add-user-feedback ${status.success ? 'success' : 'error'}`}>
              {status.success ? '✓ ' : '✕ '}{status.message}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary add-user-btn"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Adding…' : 'Add User'}
          </button>
        </form>

        <a href="/" className="add-user-back">← Back to Login</a>
      </div>
    </div>
  )
}

export default AddUser

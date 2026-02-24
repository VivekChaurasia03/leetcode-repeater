import { useState, useEffect } from 'react'
import './AddUser.css'

function AddUser() {
  // ── Shared ─────────────────────────────────────────────────────────────────
  const [userNames, setUserNames]   = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(d => setUserNames(d.users?.map(u => u.name) ?? []))
      .catch(() => {})
  }, [refreshKey])

  // ── Add user ───────────────────────────────────────────────────────────────
  const [name, setName]             = useState('')
  const [passcode, setPasscode]     = useState('')
  const [addSecret, setAddSecret]   = useState('')
  const [addStatus, setAddStatus]   = useState(null)

  useEffect(() => {
    if (!addStatus || addStatus === 'loading') return
    const t = setTimeout(() => setAddStatus(null), 2500)
    return () => clearTimeout(t)
  }, [addStatus])

  const handleAdd = async (e) => {
    e.preventDefault()
    setAddStatus('loading')
    try {
      const res = await fetch('/api/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), passcode, adminSecret: addSecret }),
      })
      const data = await res.json()
      if (res.ok) {
        setAddStatus({ success: true, message: `"${data.name}" added. They can now log in.` })
        setName('')
        setPasscode('')
        setAddSecret('')
        setRefreshKey(k => k + 1)
      } else {
        setAddStatus({ success: false, message: data.error || 'Failed to add user.' })
      }
    } catch {
      setAddStatus({ success: false, message: 'Could not connect to the server.' })
    }
  }

  // ── Delete user ────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState('')
  const [deleteSecret, setDeleteSecret] = useState('')
  const [deleteStatus, setDeleteStatus] = useState(null)
  const [confirmName, setConfirmName]   = useState(false)

  useEffect(() => {
    if (!deleteStatus || deleteStatus === 'loading') return
    const t = setTimeout(() => setDeleteStatus(null), 2500)
    return () => clearTimeout(t)
  }, [deleteStatus])

  // keep deleteTarget in sync when the user list changes
  useEffect(() => {
    if (userNames.length > 0 && !userNames.includes(deleteTarget)) {
      setDeleteTarget(userNames[0])
    }
  }, [userNames])

  const handleDelete = async (e) => {
    e.preventDefault()
    if (!confirmName) { setConfirmName(true); return }

    setDeleteStatus('loading')
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deleteTarget, adminSecret: deleteSecret }),
      })
      const data = await res.json()
      if (res.ok) {
        setDeleteStatus({ success: true, message: `"${data.name}" removed.` })
        setDeleteSecret('')
        setConfirmName(false)
        setRefreshKey(k => k + 1)
      } else {
        setDeleteStatus({ success: false, message: data.error || 'Failed to remove user.' })
        setConfirmName(false)
      }
    } catch {
      setDeleteStatus({ success: false, message: 'Could not connect to the server.' })
      setConfirmName(false)
    }
  }

  return (
    <div className="add-user-page">
      <div className="add-user-card">

        {/* ── Header ── */}
        <div className="add-user-logo">
          <span className="add-user-logo-icon">⚡</span>
          <h1>User Management</h1>
          <p>Add or remove accounts</p>
        </div>

        {/* ── Add user ── */}
        <section className="au-section">
          <h2 className="au-section-title">Add New User</h2>
          <form onSubmit={handleAdd} className="add-user-form">
            <div className="form-group">
              <label htmlFor="au-name">Full Name</label>
              <input
                id="au-name"
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setAddStatus(null) }}
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
                value={addSecret}
                onChange={e => setAddSecret(e.target.value)}
                placeholder="Admin secret"
                required
              />
            </div>

            {addStatus && addStatus !== 'loading' && (
              <p className={`au-feedback ${addStatus.success ? 'success' : 'error'}`}>
                {addStatus.success ? '✓ ' : '✕ '}{addStatus.message}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary add-user-btn"
              disabled={addStatus === 'loading'}
            >
              {addStatus === 'loading' ? 'Adding…' : 'Add User'}
            </button>
          </form>
        </section>

        {/* ── Divider ── */}
        <div className="au-divider" />

        {/* ── Remove user ── */}
        <section className="au-section">
          <h2 className="au-section-title">Remove User</h2>

          {userNames.length === 0 ? (
            <p className="au-empty">No users yet.</p>
          ) : (
            <form onSubmit={handleDelete} className="add-user-form">
              <div className="form-group">
                <label htmlFor="del-target">User to Remove</label>
                <select
                  id="del-target"
                  value={deleteTarget}
                  onChange={e => { setDeleteTarget(e.target.value); setConfirmName(false); setDeleteStatus(null) }}
                >
                  {userNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="del-secret">Admin Secret</label>
                <input
                  id="del-secret"
                  type="password"
                  value={deleteSecret}
                  onChange={e => { setDeleteSecret(e.target.value); setConfirmName(false) }}
                  placeholder="Admin secret"
                  required
                />
              </div>

              {deleteStatus && deleteStatus !== 'loading' && (
                <p className={`au-feedback ${deleteStatus.success ? 'success' : 'error'}`}>
                  {deleteStatus.success ? '✓ ' : '✕ '}{deleteStatus.message}
                </p>
              )}

              {confirmName && (
                <p className="au-confirm-warning">
                  ⚠ This will permanently delete <strong>{deleteTarget}</strong> and all their questions. Click Remove again to confirm.
                </p>
              )}

              <button
                type="submit"
                className={`add-user-btn ${confirmName ? 'btn-danger' : 'btn-secondary'}`}
                disabled={deleteStatus === 'loading'}
              >
                {deleteStatus === 'loading' ? 'Removing…' : confirmName ? 'Confirm Remove' : 'Remove User'}
              </button>
            </form>
          )}
        </section>

        <a href="/" className="add-user-back">← Back to Login</a>
      </div>
    </div>
  )
}

export default AddUser

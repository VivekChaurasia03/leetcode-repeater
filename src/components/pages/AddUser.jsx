import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import './AddUser.css'

function AddUser() {
  const [userNames, setUserNames]   = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    supabase.from('users').select('name').order('name')
      .then(({ data }) => setUserNames(data?.map(u => u.name) ?? []))
      .catch(() => {})
  }, [refreshKey])

  // ── Add user ───────────────────────────────────────────────────────────────
  const [name, setName]           = useState('')
  const [passcode, setPasscode]   = useState('')
  const [addSecret, setAddSecret] = useState('')
  const [addStatus, setAddStatus] = useState(null)

  useEffect(() => {
    if (!addStatus || addStatus === 'loading') return
    const t = setTimeout(() => setAddStatus(null), 2500)
    return () => clearTimeout(t)
  }, [addStatus])

  const handleAdd = async (e) => {
    e.preventDefault()
    setAddStatus('loading')

    const expectedSecret = import.meta.env.VITE_ADMIN_SECRET || 'admin'
    if (addSecret !== expectedSecret) {
      setAddStatus({ success: false, message: 'Invalid admin secret.' })
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      setAddStatus({ success: false, message: 'Name is required.' })
      return
    }
    if (!/^\d{4}$/.test(passcode)) {
      setAddStatus({ success: false, message: 'Passcode must be exactly 4 digits.' })
      return
    }

    const { error } = await supabase.from('users').insert({ name: trimmedName, passcode })
    if (error) {
      setAddStatus({ success: false, message: error.message || 'Failed to add user.' })
    } else {
      setAddStatus({ success: true, message: `"${trimmedName}" added. They can now log in.` })
      setName('')
      setPasscode('')
      setAddSecret('')
      setRefreshKey(k => k + 1)
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

  useEffect(() => {
    if (userNames.length > 0 && !userNames.includes(deleteTarget)) {
      setDeleteTarget(userNames[0])
    }
  }, [userNames])

  const handleDelete = async (e) => {
    e.preventDefault()
    if (!confirmName) { setConfirmName(true); return }

    const expectedSecret = import.meta.env.VITE_ADMIN_SECRET || 'admin'
    if (deleteSecret !== expectedSecret) {
      setDeleteStatus({ success: false, message: 'Invalid admin secret.' })
      setConfirmName(false)
      return
    }

    setDeleteStatus('loading')
    const { error } = await supabase.from('users').delete().eq('name', deleteTarget)
    if (error) {
      setDeleteStatus({ success: false, message: error.message || 'Failed to remove user.' })
      setConfirmName(false)
    } else {
      setDeleteStatus({ success: true, message: `"${deleteTarget}" removed.` })
      setDeleteSecret('')
      setConfirmName(false)
      setRefreshKey(k => k + 1)
    }
  }

  return (
    <div className="add-user-page">
      <div className="add-user-card">

        <div className="add-user-logo">
          <span className="add-user-logo-icon">⚡</span>
          <h1>User Management</h1>
          <p>Add or remove accounts</p>
        </div>

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

        <div className="au-divider" />

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
                  This will permanently delete {deleteTarget} and all their questions. Click Remove again to confirm.
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

        <a href="/" className="add-user-back">Back to Login</a>
      </div>
    </div>
  )
}

export default AddUser

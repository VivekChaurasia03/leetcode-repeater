import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import './Login.css'

function Login({ onLogin }) {
  const [name, setName]         = useState('')
  const [passcode, setPasscode] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, name, passcode')
        .ilike('name', name.trim())
        .maybeSingle()

      if (!user) {
        setError('User not found. Check your name and try again.')
        setLoading(false)
        return
      }

      if (user.passcode !== passcode) {
        setError('Incorrect passcode.')
        setLoading(false)
        return
      }

      onLogin({ name: user.name, id: user.id })
    } catch {
      setError('Could not connect. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">⚡</span>
          <h1>LeetCode Repeater</h1>
          <p>Track your spaced repetition journey</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Vivek"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="passcode">4-Digit Passcode</label>
            <input
              id="passcode"
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Logging in…' : 'Enter'}
          </button>
        </form>
        <a href="/add-user" className="login-add-user-link">
          Add a new user
        </a>
      </div>
    </div>
  )
}

export default Login

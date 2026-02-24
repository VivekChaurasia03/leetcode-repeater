import { useState, useEffect } from 'react'
import './Modal.css'
import DatePicker from '../common/DatePicker'

function AddModal({ onClose, onSubmit }) {
  const today = new Date().toISOString().split('T')[0]
  const [number, setNumber]       = useState('')
  const [date, setDate]           = useState(today)
  const [error, setError]         = useState('')
  const [problemInfo, setProblemInfo] = useState(null)
  // null | 'loading' | 'not-found' | 'error' | 'rate-limited' | { title, difficulty, slug, tags, url }

  // Debounced problem fetch
  useEffect(() => {
    const num = parseInt(number, 10)
    if (!number || isNaN(num) || num < 1 || num > 9999) {
      setProblemInfo(null)
      return
    }

    setProblemInfo('loading')
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/problem/${num}`)
        if (res.status === 404)      { setProblemInfo('not-found');    return }
        if (res.status === 429)      { setProblemInfo('rate-limited'); return }
        if (!res.ok)                 { setProblemInfo('error');        return }
        const data = await res.json()
        setProblemInfo(data)
      } catch {
        setProblemInfo('error')
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [number])

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseInt(number, 10)
    if (!num || num < 1 || num > 9999) {
      setError('Enter a valid question number between 1 and 9999.')
      return
    }
    if (!date) {
      setError('Please pick a date.')
      return
    }
    const meta = typeof problemInfo === 'object' && problemInfo !== null ? problemInfo : {}
    onSubmit(num, date, meta)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">Add Question</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="q-number">LeetCode Question Number</label>
            <input
              id="q-number"
              type="number"
              value={number}
              onChange={e => { setNumber(e.target.value); setError('') }}
              placeholder="e.g. 105"
              min="1"
              max="9999"
              autoFocus
              required
            />
          </div>

          {/* Problem preview */}
          <ProblemPreview info={problemInfo} />

          <div className="form-group">
            <label htmlFor="q-date">Schedule For</label>
            <DatePicker id="q-date" value={date} onChange={setDate} />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Question
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProblemPreview({ info }) {
  if (!info) return null

  if (info === 'loading') {
    return (
      <div className="problem-preview problem-preview--loading">
        <span className="preview-spinner" />
        <span>Looking up problem…</span>
      </div>
    )
  }

  if (info === 'not-found') {
    return (
      <div className="problem-preview problem-preview--warn">
        ⚠ Problem not found on LeetCode — you can still add it manually.
      </div>
    )
  }

  if (info === 'rate-limited') {
    return (
      <div className="problem-preview problem-preview--warn">
        ⚠ LeetCode rate limited — you can still add it manually.
      </div>
    )
  }

  if (info === 'error') {
    return (
      <div className="problem-preview problem-preview--warn">
        Could not reach LeetCode — you can still add it manually.
      </div>
    )
  }

  // Success
  const diff = info.difficulty?.toLowerCase()
  return (
    <div className="problem-preview problem-preview--success">
      <div className="preview-row">
        <span className="preview-title">{info.title}</span>
        {info.difficulty && (
          <span className={`difficulty-badge difficulty-badge--${diff}`}>
            {info.difficulty}
          </span>
        )}
      </div>
      {info.tags?.length > 0 && (
        <div className="preview-tags">
          {info.tags.slice(0, 4).join(' · ')}
          {info.tags.length > 4 && ` +${info.tags.length - 4}`}
        </div>
      )}
    </div>
  )
}

export default AddModal

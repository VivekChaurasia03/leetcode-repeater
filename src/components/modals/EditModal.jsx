import { useState, useEffect } from 'react'
import './Modal.css'
import DatePicker from '../common/DatePicker'

function EditModal({ question, mode, onClose, onEdit, onReschedule }) {
  const [number, setNumber] = useState(String(question.number))
  const [date, setDate]     = useState(question.scheduledDate)
  const [error, setError]   = useState('')
  const [problemInfo, setProblemInfo] = useState(null)

  const isEdit = mode === 'edit'

  // Fetch problem info when editing and number changes
  useEffect(() => {
    if (!isEdit) return
    
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
  }, [number, isEdit])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isEdit) {
      const num = parseInt(number, 10)
      if (!num || num < 1 || num > 9999) {
        setError('Enter a valid question number between 1 and 9999.')
        return
      }
      const meta = typeof problemInfo === 'object' && problemInfo !== null ? problemInfo : {}
      onEdit(question.id, num, meta)
    } else {
      if (!date) {
        setError('Please pick a date.')
        return
      }
      onReschedule(question.id, date)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">
            {isEdit ? 'Edit Question' : `Reschedule #${question.number}`}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {isEdit ? (
            <div className="form-group">
              <label htmlFor="edit-number">Question Number</label>
              <input
                id="edit-number"
                type="number"
                value={number}
                onChange={e => { setNumber(e.target.value); setError('') }}
                min="1"
                max="9999"
                autoFocus
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="edit-date">New Date</label>
              <DatePicker id="edit-date" value={date} onChange={setDate} />
            </div>
          )}

          {isEdit && <ProblemPreview info={problemInfo} />}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEdit ? 'Save Changes' : 'Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProblemPreview({ info }) {
  if (!info || info === 'loading') return null
  if (info === 'not-found') return <p className="form-info info--error">Problem not found on LeetCode</p>
  if (info === 'rate-limited') return <p className="form-info info--warning">LeetCode rate limited — try again in a moment</p>
  if (info === 'error') return <p className="form-info info--error">Could not reach LeetCode</p>
  if (typeof info === 'object' && info.title) {
    return (
      <div className="form-info info--success">
        <strong>{info.title}</strong> · <span className={`difficulty-badge difficulty-badge--${info.difficulty?.toLowerCase()}`}>{info.difficulty}</span>
      </div>
    )
  }
  return null
}

export default EditModal

import { useState } from 'react'
import './Modal.css'

function EditModal({ question, mode, onClose, onEdit, onReschedule }) {
  const [number, setNumber] = useState(String(question.number))
  const [date, setDate]     = useState(question.scheduledDate)
  const [error, setError]   = useState('')

  const isEdit = mode === 'edit'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isEdit) {
      const num = parseInt(number, 10)
      if (!num || num < 1 || num > 9999) {
        setError('Enter a valid question number between 1 and 9999.')
        return
      }
      onEdit(question.id, num)
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
              <input
                id="edit-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                autoFocus
                required
              />
            </div>
          )}

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

export default EditModal

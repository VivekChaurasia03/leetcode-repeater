import { useState } from 'react'
import './Modal.css'
import DatePicker from '../common/DatePicker'

function EditTaskModal({ task, mode, onClose, onSave, onReschedule }) {
  const [header, setHeader] = useState(task.header)
  const [notes, setNotes]   = useState(task.notes || '')
  const [date, setDate]     = useState(task.date)
  const [error, setError]   = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'reschedule') {
      if (!date) { setError('Please pick a date.'); return }
      onReschedule(task.id, date)
    } else {
      if (!header.trim()) { setError('Title is required.'); return }
      onSave(task.id, { header: header.trim(), notes: notes.trim() })
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{mode === 'reschedule' ? 'Reschedule Task' : 'Edit Task'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {mode === 'reschedule' ? (
            <div className="form-group">
              <label htmlFor="etm-date">New Date</label>
              <DatePicker id="etm-date" value={date} onChange={setDate} />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="etm-header">Title</label>
                <input
                  id="etm-header"
                  type="text"
                  value={header}
                  onChange={e => { setHeader(e.target.value); setError('') }}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="etm-notes">Notes</label>
                <textarea
                  id="etm-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows="5"
                  className="modal-textarea"
                  placeholder="Add notes..."
                />
              </div>
            </>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {mode === 'reschedule' ? 'Reschedule' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTaskModal

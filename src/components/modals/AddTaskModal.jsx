import { useState } from 'react'
import './Modal.css'
import DatePicker from '../common/DatePicker'
import { getTodayLocal } from '../../hooks/useData.js'

function AddTaskModal({ onClose, onSubmit }) {
  const today = getTodayLocal()
  const [header, setHeader] = useState('')
  const [notes, setNotes]   = useState('')
  const [date, setDate]     = useState(today)
  const [error, setError]   = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!header.trim()) {
      setError('Task title is required.')
      return
    }
    if (!date) {
      setError('Please pick a date.')
      return
    }
    onSubmit(date, header.trim(), notes.trim())
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>Add Task</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="task-header">Title</label>
            <input
              id="task-header"
              type="text"
              value={header}
              onChange={e => { setHeader(e.target.value); setError('') }}
              placeholder="e.g. Review sorting algorithms"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-date">Date</label>
            <DatePicker id="task-date" value={date} onChange={setDate} />
          </div>

          <div className="form-group">
            <label htmlFor="task-notes">Notes (optional)</label>
            <textarea
              id="task-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any extra context or links..."
              rows="3"
              className="modal-textarea"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTaskModal

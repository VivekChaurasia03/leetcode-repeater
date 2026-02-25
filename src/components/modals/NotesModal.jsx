import { useState } from 'react'
import './Modal.css'

function NotesModal({ question, onClose, onSave }) {
  const [notes, setNotes] = useState(question.notes || '')
  const [saved, setSaved] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    await onSave(question.id, notes)
    setSaved(true)
    setTimeout(() => onClose(), 1000)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">Notes for #{question.number}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="form-group">
            <label htmlFor="notes-text">Add your notes</label>
            <textarea
              id="notes-text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Try greedy approach, Use BFS, Solve with Heap, Two pointers..."
              rows="6"
              className="modal-textarea"
              autoFocus
            />
          </div>

          {saved && (
            <p className="form-success">✓ Notes saved</p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Notes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NotesModal

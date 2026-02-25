import { useState } from 'react'
import { useData, getTodayLocal } from '../../hooks/useData.js'
import DateSection from '../common/DateSection.jsx'
import AddModal from '../modals/AddModal.jsx'
import EditModal from '../modals/EditModal.jsx'
import NotesModal from '../modals/NotesModal.jsx'
import DatePicker from '../common/DatePicker.jsx'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const {
    data, loading, error,
    getUserData, addQuestion,
    rescheduleQuestion, markMastered,
    unmarkMastered, editQuestion, deleteQuestion, saveNotes,
    getAllFAQs, rescheduleFAQ, masterFAQ, deleteFAQ,
  } = useData()

  const [view, setView] = useState('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [notesTarget, setNotesTarget] = useState(null)
  const [faqRescheduleTarget, setFAQRescheduleTarget] = useState(null)
  const [draggingId, setDraggingId] = useState(null)

  if (loading) {
    return (
      <div className="dashboard-center">
        <div className="spinner" />
        <p>Loading your questions…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-center dashboard-error-msg">
        <p>⚠ Could not load data</p>
        <small>{error}</small>
      </div>
    )
  }

  const userData = getUserData(user.name)
  if (!userData) {
    return (
      <div className="dashboard-center dashboard-error-msg">
        <p>User data not found.</p>
      </div>
    )
  }

  const today = getTodayLocal()

  const pendingQuestions = userData.questions.filter(q => q.status === 'pending')
  const masteredQuestions = userData.questions.filter(q => q.status === 'mastered')

  const questionsByDate = pendingQuestions.reduce((acc, q) => {
    if (!acc[q.scheduledDate]) acc[q.scheduledDate] = []
    acc[q.scheduledDate].push(q)
    return acc
  }, {})

  const sortedDates = Object.keys(questionsByDate).sort((a, b) => a.localeCompare(b))

  const getDateType = (date) => {
    if (date < today) return 'overdue'
    if (date === today) return 'today'
    return 'future'
  }

  const handleAddQuestion = async (number, date, meta) => {
    await addQuestion(user.name, number, date, meta)
    setShowAddModal(false)
  }

  const handleEdit = async (questionId, newNumber, meta = {}) => {
    await editQuestion(user.name, questionId, newNumber, meta)
    setEditTarget(null)
  }

  const handleReschedule = async (questionId, newDate) => {
    await rescheduleQuestion(user.name, questionId, newDate)
    setEditTarget(null)
  }

  const handleMarkMastered = (questionId) => markMastered(user.name, questionId)
  const handleUnmarkMastered = (questionId) => unmarkMastered(user.name, questionId)
  const handleDelete = (questionId) => deleteQuestion(user.name, questionId)
  const handleSaveNotes = (questionId, notes) => saveNotes(user.name, questionId, notes)
  const handleNotesOpen = (question) => setNotesTarget(question)

  const handleDragStart = (questionId) => setDraggingId(questionId)
  const handleDragEnd   = ()           => setDraggingId(null)
  const handleDropOnDate = async (targetDate, questionId) => {
    setDraggingId(null)
    const question = userData.questions.find(q => q.id === questionId)
    if (!question || question.scheduledDate === targetDate) return
    await rescheduleQuestion(user.name, questionId, targetDate)
  }

  // ── FAQ Handlers ──────────────────────────────────────────────
  const handleFAQReschedule = async (faqId, targetDate, notes = '') => {
    await rescheduleFAQ(user.name, faqId, targetDate, notes)
    setFAQRescheduleTarget(null)
  }

  const handleFAQMaster = async (faqId) => {
    await masterFAQ(user.name, faqId)
  }

  const handleFAQDelete = async (faqId) => {
    await deleteFAQ(faqId)
  }

  const firstName = user.name.split(' ')[0]

  return (
    <div className="dashboard">
      {/* ── Navbar ──────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-logo">⚡</span>
          <span className="navbar-title">LeetCode Repeater</span>
        </div>

        <div className="navbar-center">
          <button
            className={`nav-tab ${view === 'active' ? 'active' : ''}`}
            onClick={() => setView('active')}
          >
            Active
            {pendingQuestions.length > 0 && (
              <span className="nav-badge">{pendingQuestions.length}</span>
            )}
          </button>
          <button
            className={`nav-tab ${view === 'mastered' ? 'active' : ''}`}
            onClick={() => setView('mastered')}
          >
            Mastered
            {masteredQuestions.length > 0 && (
              <span className="nav-badge mastered">{masteredQuestions.length}</span>
            )}
          </button>
          <button
            className={`nav-tab ${view === 'faq' ? 'active' : ''}`}
            onClick={() => setView('faq')}
          >
            FAQs
            {Object.keys(getAllFAQs()).length > 0 && (
              <span className="nav-badge">{Object.keys(getAllFAQs()).length}</span>
            )}
          </button>
        </div>

        <div className="navbar-right">
          <span className="navbar-user">{firstName}</span>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      {/* ── Main content ────────────────────────── */}
      <main className="dashboard-main">
        {view === 'active' ? (
          <>
            <div className="dashboard-header">
              <div>
                <h2>Your Schedule</h2>
                <p className="dashboard-subtitle">
                  {sortedDates.length === 0
                    ? 'No active questions — add one below!'
                    : `${pendingQuestions.length} question${pendingQuestions.length !== 1 ? 's' : ''} across ${sortedDates.length} date${sortedDates.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              <button className="btn-add" onClick={() => setShowAddModal(true)}>
                + Add Question
              </button>
            </div>

            {sortedDates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <h3>Nothing scheduled yet</h3>
                <p>Add a LeetCode question and pick a date to start tracking your repeats.</p>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                  Add Your First Question
                </button>
              </div>
            ) : (
              <div className="date-list">
                {sortedDates.map(date => (
                  <DateSection
                    key={date}
                    date={date}
                    dateType={getDateType(date)}
                    questions={questionsByDate[date]}
                    defaultOpen={getDateType(date) !== 'future'}
                    draggingId={draggingId}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDropQuestion={(qId) => handleDropOnDate(date, qId)}
                    onEdit={(q) => setEditTarget({ question: q, mode: 'edit' })}
                    onReschedule={(q) => setEditTarget({ question: q, mode: 'reschedule' })}
                    onMarkMastered={handleMarkMastered}
                    onDelete={handleDelete}
                    onNotes={handleNotesOpen}
                  />
                ))}
              </div>
            )}
          </>
        ) : view === 'mastered' ? (
          <div className="mastered-view">
            <div className="dashboard-header">
              <div>
                <h2>Mastered Problems</h2>
                <p className="dashboard-subtitle">
                  {masteredQuestions.length === 0
                    ? 'Nothing mastered yet'
                    : `${masteredQuestions.length} problem${masteredQuestions.length !== 1 ? 's' : ''} printed on your brain 🧠`
                  }
                </p>
              </div>
            </div>

            {masteredQuestions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🧠</div>
                <h3>No mastered problems yet</h3>
                <p>Mark a question as mastered when you can solve it cold — no hints, no stuckings.</p>
              </div>
            ) : (
              <div className="mastered-grid">
                {masteredQuestions.map(q => {
                  const url = q.slug
                    ? `https://leetcode.com/problems/${q.slug}/`
                    : `https://leetcode.com/problemset/?search=${q.number}`
                  return (
                    <div key={q.id} className="mastered-chip">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mastered-chip-link"
                        title={`Open problem ${q.number} on LeetCode`}
                      >
                        #{q.number} {q.title ? `- ${q.title}` : ''}
                      </a>
                      <button
                        className="mastered-chip-undo"
                        title="Move back to active"
                        onClick={() => handleUnmarkMastered(q.id)}
                      >
                        ↩
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : view === 'faq' ? (
          <div className="faq-view">
            <div className="dashboard-header">
              <div>
                <h2>FAQ Questions</h2>
                <p className="dashboard-subtitle">
                  {Object.keys(getAllFAQs()).length === 0
                    ? 'No FAQ questions'
                    : `${Object.keys(getAllFAQs()).length} question${Object.keys(getAllFAQs()).length !== 1 ? 's' : ''} available`
                  }
                </p>
              </div>
            </div>

            {Object.keys(getAllFAQs()).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">❓</div>
                <h3>No FAQ questions</h3>
              </div>
            ) : (
              <div className="date-list">
                {Object.entries(getAllFAQs()).map(([faqId, faq]) => (
                  <div key={faqId} className="question-card" draggable={false}>
                    <div className="drag-handle" style={{ visibility: 'hidden' }} />
                    <div className="question-card-left">
                      <a
                        href={faq.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="question-number"
                        title={faq.title || `Search problem ${faq.number} on LeetCode`}
                      >
                        <span className="question-hash">#</span>{faq.number}
                        {faq.difficulty && (
                          <span className={`difficulty-badge difficulty-badge--${faq.difficulty.toLowerCase()}`}>
                            {faq.difficulty}
                          </span>
                        )}
                        <ExternalLinkIcon />
                      </a>
                      {faq.title && (
                        <p className="question-title">{faq.title}</p>
                      )}
                    </div>

                    <div className="question-card-actions">
                      <button
                        className="action-btn action-btn--reschedule"
                        title="Schedule to a date with notes"
                        onClick={() => setFAQRescheduleTarget(faqId)}
                      >
                        <CalendarIcon />
                        <span>Reschedule</span>
                      </button>

                      <button
                        className="action-btn action-btn--master"
                        title="Mark as mastered"
                        onClick={() => handleFAQMaster(faqId)}
                      >
                        <CheckIcon />
                        <span>Mastered</span>
                      </button>

                      <button
                        className="action-btn action-btn--delete"
                        title="Delete question"
                        onClick={() => handleFAQDelete(faqId)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* ── Modals ──────────────────────────────── */}
      {showAddModal && (
        <AddModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddQuestion}
        />
      )}
      {editTarget && (
        <EditModal
          question={editTarget.question}
          mode={editTarget.mode}
          onClose={() => setEditTarget(null)}
          onEdit={handleEdit}
          onReschedule={handleReschedule}
        />
      )}
      {notesTarget && (
        <NotesModal
          question={notesTarget}
          onClose={() => setNotesTarget(null)}
          onSave={handleSaveNotes}
        />
      )}
      {faqRescheduleTarget && (
        <FAQRescheduleModal
          faqId={faqRescheduleTarget}
          faq={getAllFAQs()[faqRescheduleTarget]}
          onClose={() => setFAQRescheduleTarget(null)}
          onSubmit={handleFAQReschedule}
        />
      )}
    </div>
  )
}

/* ── Icon Components ───────────────────────────── */

function ExternalLinkIcon() {
  return (
    <svg className="ext-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

/* ── Modal Components ───────────────────────────── */

function FAQRescheduleModal({ faqId, faq, onClose, onSubmit }) {
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState(faq?.notes || '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!date) {
      setError('Please pick a date.')
      return
    }
    onSubmit(faqId, date, notes)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>Schedule #{faq?.number} - {faq?.title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="faq-date">Select Date</label>
            <DatePicker id="faq-date" value={date} onChange={setDate} />
          </div>

          <div className="form-group">
            <label htmlFor="faq-notes">Notes (Optional)</label>
            <textarea
              id="faq-notes"
              value={notes}
              onChange={e => { setNotes(e.target.value); setError('') }}
              placeholder="e.g. Think about edge cases..."
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
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default Dashboard


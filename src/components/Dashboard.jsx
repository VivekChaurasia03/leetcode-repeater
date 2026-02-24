import { useState } from 'react'
import { useData } from '../hooks/useData.js'
import DateSection from './DateSection.jsx'
import AddModal from './AddModal.jsx'
import EditModal from './EditModal.jsx'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const {
    data, loading, error,
    getUserData, addQuestion,
    rescheduleQuestion, markMastered,
    unmarkMastered, editQuestion, deleteQuestion,
  } = useData()

  const [view, setView] = useState('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

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

  const today = new Date().toISOString().split('T')[0]

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

  const handleEdit = async (questionId, newNumber) => {
    await editQuestion(user.name, questionId, newNumber)
    setEditTarget(null)
  }

  const handleReschedule = async (questionId, newDate) => {
    await rescheduleQuestion(user.name, questionId, newDate)
    setEditTarget(null)
  }

  const handleMarkMastered = (questionId) => markMastered(user.name, questionId)
  const handleUnmarkMastered = (questionId) => unmarkMastered(user.name, questionId)
  const handleDelete = (questionId) => deleteQuestion(user.name, questionId)

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
                    onEdit={(q) => setEditTarget({ question: q, mode: 'edit' })}
                    onReschedule={(q) => setEditTarget({ question: q, mode: 'reschedule' })}
                    onMarkMastered={handleMarkMastered}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
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
                {masteredQuestions.map(q => (
                  <div key={q.id} className="mastered-chip">
                    <a
                      href={`https://leetcode.com/problemset/?search=${q.number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mastered-chip-link"
                      title={`Open problem ${q.number} on LeetCode`}
                    >
                      #{q.number}
                    </a>
                    <button
                      className="mastered-chip-undo"
                      title="Move back to active"
                      onClick={() => handleUnmarkMastered(q.id)}
                    >
                      ↩
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
    </div>
  )
}

export default Dashboard

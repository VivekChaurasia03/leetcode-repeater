import { useState } from 'react'
import { useData, getTodayLocal } from '../../hooks/useData.js'
import DateSection from '../common/DateSection.jsx'
import TaskSection from '../common/TaskSection.jsx'
import AddModal from '../modals/AddModal.jsx'
import EditModal from '../modals/EditModal.jsx'
import NotesModal from '../modals/NotesModal.jsx'
import AddTaskModal from '../modals/AddTaskModal.jsx'
import EditTaskModal from '../modals/EditTaskModal.jsx'
import DatePicker from '../common/DatePicker.jsx'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const {
    loading, error,
    getUserData, addQuestion,
    rescheduleQuestion, markMastered,
    unmarkMastered, editQuestion, deleteQuestion, saveNotes,
    getAllFAQs, rescheduleFAQ, masterFAQ, deleteFAQ,
    addTask, deleteTask, toggleTask, rescheduleTask, editTask,
  } = useData()

  const [view, setView] = useState('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [editTaskTarget, setEditTaskTarget] = useState(null) // { task, mode: 'edit'|'reschedule' }
  const [editTarget, setEditTarget] = useState(null)
  const [notesTarget, setNotesTarget] = useState(null)
  const [faqRescheduleTarget, setFAQRescheduleTarget] = useState(null) // { company, faqId }
  const [collapsedCompanies, setCollapsedCompanies] = useState(new Set())
  const [draggingId, setDraggingId] = useState(null)
  const [draggingTaskId, setDraggingTaskId] = useState(null)

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
    const added = await addQuestion(user.name, number, date, meta)
    if (added === false) return 'Question #' + number + ' is already in your list.'
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

  // ── Task handlers ──────────────────────────────────────────────
  const userTasks = userData.tasks || []

  const tasksByDate = userTasks.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = []
    acc[t.date].push(t)
    return acc
  }, {})

  const incompleteDates = Object.keys(tasksByDate).filter(d => tasksByDate[d].some(t => !t.done))
  const completedDates  = Object.keys(tasksByDate).filter(d => tasksByDate[d].every(t => t.done))

  const sortedTaskDates = [
    ...incompleteDates.sort((a, b) => a.localeCompare(b)),
    ...completedDates.sort((a, b) => a.localeCompare(b)),
  ]

  const handleAddTask = async (date, header, notes) => {
    await addTask(user.name, date, header, notes)
    setShowAddTaskModal(false)
  }

  const handleToggleTask  = (taskId) => toggleTask(user.name, taskId)
  const handleDeleteTask  = (taskId) => deleteTask(user.name, taskId)

  const handleEditTask = async (taskId, updates) => {
    await editTask(user.name, taskId, updates)
    setEditTaskTarget(null)
  }
  const handleRescheduleTask = async (taskId, newDate) => {
    await rescheduleTask(user.name, taskId, newDate)
    setEditTaskTarget(null)
  }

  const handleTaskDragStart = (taskId) => setDraggingTaskId(taskId)
  const handleTaskDragEnd   = ()       => setDraggingTaskId(null)
  const handleDropTaskOnDate = async (targetDate, taskId) => {
    setDraggingTaskId(null)
    const task = userTasks.find(t => t.id === taskId)
    if (!task || task.date === targetDate) return
    await rescheduleTask(user.name, taskId, targetDate)
  }

  // ── FAQ Handlers ──────────────────────────────────────────────
  const handleFAQReschedule = async (company, faqId, targetDate, notes = '') => {
    await rescheduleFAQ(user.name, company, faqId, targetDate, notes)
    setFAQRescheduleTarget(null)
  }

  const handleFAQMaster = async (company, faqId) => {
    await masterFAQ(user.name, company, faqId)
  }

  const handleFAQDelete = async (company, faqId) => {
    await deleteFAQ(company, faqId)
  }

  const toggleCompany = (company) => {
    setCollapsedCompanies(prev => {
      const next = new Set(prev)
      if (next.has(company)) next.delete(company)
      else next.add(company)
      return next
    })
  }

  const totalFAQCount = Object.values(getAllFAQs()).reduce((sum, arr) => sum + arr.length, 0)

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
            className={`nav-tab nav-tab--active ${view === 'active' ? 'active' : ''}`}
            onClick={() => setView('active')}
          >
            Active
            {pendingQuestions.length > 0 && (
              <span className="nav-badge">{pendingQuestions.length}</span>
            )}
          </button>
          <button
            className={`nav-tab nav-tab--mastered ${view === 'mastered' ? 'active' : ''}`}
            onClick={() => setView('mastered')}
          >
            Mastered
            {masteredQuestions.length > 0 && (
              <span className="nav-badge mastered">{masteredQuestions.length}</span>
            )}
          </button>
          <button
            className={`nav-tab nav-tab--faq ${view === 'faq' ? 'active' : ''}`}
            onClick={() => setView('faq')}
          >
            FAQs
            {totalFAQCount > 0 && (
              <span className="nav-badge faq">{totalFAQCount}</span>
            )}
          </button>
          <button
            className={`nav-tab nav-tab--todo ${view === 'todo' ? 'active' : ''}`}
            onClick={() => setView('todo')}
          >
            Todo
            {userTasks.filter(t => !t.done).length > 0 && (
              <span className="nav-badge todo">{userTasks.filter(t => !t.done).length}</span>
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
                        className="mastered-chip-notes"
                        title="View notes"
                        onClick={() => handleNotesOpen(q)}
                      >
                        <NotesIcon />
                      </button>
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
                  {totalFAQCount === 0
                    ? 'No FAQ questions'
                    : `${totalFAQCount} question${totalFAQCount !== 1 ? 's' : ''} across ${Object.keys(getAllFAQs()).length} compan${Object.keys(getAllFAQs()).length !== 1 ? 'ies' : 'y'}`
                  }
                </p>
              </div>
            </div>

            {totalFAQCount === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">❓</div>
                <h3>No FAQ questions</h3>
              </div>
            ) : (
              <div className="date-list">
                {Object.entries(getAllFAQs()).map(([company, questions]) => {
                  const isCollapsed = collapsedCompanies.has(company)
                  const count = questions.length
                  return (
                    <div key={company} className="faq-company-section">
                      <button className="date-section-header" onClick={() => toggleCompany(company)}>
                        <div className="date-section-header-left">
                          <span className={`date-section-chevron ${!isCollapsed ? 'open' : ''}`}>›</span>
                          <span className="faq-company-name">{company}</span>
                        </div>
                        <span className="date-section-count">{count} Q{count !== 1 ? 's' : ''}</span>
                      </button>

                      {!isCollapsed && (
                        <div className="faq-company-questions">
                          {questions.map(faq => (
                            <div key={faq.id} className="question-card" draggable={false}>
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
                                  onClick={() => setFAQRescheduleTarget({ company, faqId: faq.id })}
                                >
                                  <CalendarIcon />
                                  <span>Reschedule</span>
                                </button>

                                <button
                                  className="action-btn action-btn--master"
                                  title="Mark as mastered"
                                  onClick={() => handleFAQMaster(company, faq.id)}
                                >
                                  <CheckIcon />
                                  <span>Mastered</span>
                                </button>

                                <button
                                  className="action-btn action-btn--delete"
                                  title="Delete question"
                                  onClick={() => handleFAQDelete(company, faq.id)}
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : view === 'todo' ? (
          <>
            <div className="dashboard-header">
              <div>
                <h2>Tasks</h2>
                <p className="dashboard-subtitle">
                  {userTasks.length === 0
                    ? 'No tasks yet — add one below!'
                    : `${userTasks.filter(t => !t.done).length} remaining across ${sortedTaskDates.length} date${sortedTaskDates.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              <button className="btn-add" onClick={() => setShowAddTaskModal(true)}>
                + Add Task
              </button>
            </div>

            {userTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h3>No tasks yet</h3>
                <p>Add tasks by date to keep track of what you need to do.</p>
                <button className="btn-primary" onClick={() => setShowAddTaskModal(true)}>
                  Add Your First Task
                </button>
              </div>
            ) : (
              <div className="date-list">
                {sortedTaskDates.map(date => (
                  <TaskSection
                    key={date}
                    date={date}
                    dateType={getDateType(date)}
                    tasks={tasksByDate[date]}
                    allDone={completedDates.includes(date)}
                    defaultOpen={!completedDates.includes(date)}
                    draggingId={draggingTaskId}
                    onDragStart={handleTaskDragStart}
                    onDragEnd={handleTaskDragEnd}
                    onDropTask={(taskId) => handleDropTaskOnDate(date, taskId)}
                    onToggle={handleToggleTask}
                    onEdit={(task) => setEditTaskTarget({ task, mode: 'edit' })}
                    onReschedule={(task) => setEditTaskTarget({ task, mode: 'reschedule' })}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </>
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
          company={faqRescheduleTarget.company}
          faqId={faqRescheduleTarget.faqId}
          faq={getAllFAQs()[faqRescheduleTarget.company]?.find(f => String(f.id) === String(faqRescheduleTarget.faqId))}
          onClose={() => setFAQRescheduleTarget(null)}
          onSubmit={handleFAQReschedule}
        />
      )}
      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onSubmit={handleAddTask}
        />
      )}
      {editTaskTarget && (
        <EditTaskModal
          task={editTaskTarget.task}
          mode={editTaskTarget.mode}
          onClose={() => setEditTaskTarget(null)}
          onSave={handleEditTask}
          onReschedule={handleRescheduleTask}
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

function FAQRescheduleModal({ company, faqId, faq, onClose, onSubmit }) {
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState(faq?.notes || '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!date) {
      setError('Please pick a date.')
      return
    }
    onSubmit(company, faqId, date, notes)
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


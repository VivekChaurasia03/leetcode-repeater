import './QuestionCard.css'

function QuestionCard({ question, isDragging, onDragStart, onDragEnd, onEdit, onReschedule, onMarkMastered, onDelete }) {
  const url = question.slug
    ? `https://leetcode.com/problems/${question.slug}/`
    : `https://leetcode.com/problemset/?search=${question.number}`

  const diff = question.difficulty?.toLowerCase()

  return (
    <div
      className={`question-card${isDragging ? ' question-card--dragging' : ''}`}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', question.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(question.id)
      }}
      onDragEnd={onDragEnd}
    >
      <div className="drag-handle" aria-hidden="true"><DragHandleIcon /></div>
      <div className="question-card-left">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="question-number"
          title={question.title || `Search problem ${question.number} on LeetCode`}
        >
          <span className="question-hash">#</span>{question.number}
          {diff && (
            <span className={`difficulty-badge difficulty-badge--${diff}`}>
              {question.difficulty}
            </span>
          )}
          <ExternalLinkIcon />
        </a>
        {question.title && (
          <p className="question-title">{question.title}</p>
        )}
      </div>

      <div className="question-card-actions">
        <button
          className="action-btn action-btn--reschedule"
          title="Reschedule to another date"
          onClick={() => onReschedule(question)}
        >
          <CalendarIcon />
          <span>Reschedule</span>
        </button>

        <button
          className="action-btn action-btn--edit"
          title="Edit question number"
          onClick={() => onEdit(question)}
        >
          <EditIcon />
          <span>Edit</span>
        </button>

        <button
          className="action-btn action-btn--master"
          title="Mark as mastered — printed on your brain!"
          onClick={() => onMarkMastered(question.id)}
        >
          <CheckIcon />
          <span>Mastered</span>
        </button>

        <button
          className="action-btn action-btn--delete"
          title="Delete question"
          onClick={() => onDelete(question.id)}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

/* ── Inline SVG icons ───────────────────────────── */

function DragHandleIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
      <circle cx="2.5" cy="3"  r="1.5" /><circle cx="7.5" cy="3"  r="1.5" />
      <circle cx="2.5" cy="8"  r="1.5" /><circle cx="7.5" cy="8"  r="1.5" />
      <circle cx="2.5" cy="13" r="1.5" /><circle cx="7.5" cy="13" r="1.5" />
    </svg>
  )
}

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

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="m18.5 2.5 3 3L12 15H9v-3z" />
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

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="m19 6-.867 14.142A2 2 0 0 1 16.138 22H7.862a2 2 0 0 1-1.995-1.858L5 6z" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export default QuestionCard

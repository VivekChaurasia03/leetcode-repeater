import { useState, useRef, useEffect } from 'react'
import QuestionCard from './QuestionCard.jsx'
import './DateSection.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()

  const todayStr = today.toISOString().split('T')[0]
  if (dateStr === todayStr) return 'Today'

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'

  const dayName   = DAYS[date.getDay()]
  const monthName = MONTHS[month - 1]
  return `${dayName}, ${monthName} ${day}, ${year}`
}

function getDueLabel(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const diff = Math.round((today - date) / 86400000) // days

  if (diff === 0) return null
  if (diff > 0) return `${diff} day${diff !== 1 ? 's' : ''} overdue`
  return `in ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''}`
}

function DateSection({ date, dateType, questions, defaultOpen, draggingId, onDragStart, onDragEnd, onDropQuestion, onEdit, onReschedule, onMarkMastered, onDelete }) {
  const [open, setOpen]         = useState(defaultOpen)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  // Reset highlight when drag ends without a drop
  useEffect(() => {
    if (!draggingId) { dragCounter.current = 0; setIsDragOver(false) }
  }, [draggingId])

  // Auto-expand collapsed sections when dragging over them
  useEffect(() => {
    if (isDragOver && !open) setOpen(true)
  }, [isDragOver])

  const handleDragOver  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; if (dragCounter.current === 1) setIsDragOver(true) }
  const handleDragLeave = ()  => { dragCounter.current--; if (dragCounter.current === 0) setIsDragOver(false) }
  const handleDrop      = (e) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    const questionId = e.dataTransfer.getData('text/plain')
    if (questionId) onDropQuestion(questionId)
  }

  const label    = formatDate(date)
  const dueLabel = getDueLabel(date)

  return (
    <div
      className={`date-section date-section--${dateType}${isDragOver ? ' date-section--dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button className="date-section-header" onClick={() => setOpen(o => !o)}>
        <div className="date-section-header-left">
          <span className={`date-section-chevron ${open ? 'open' : ''}`}>›</span>
          <div className="date-section-title">
            <span className="date-section-label">{label}</span>
            {dueLabel && (
              <span className={`date-section-badge ${dateType}`}>{dueLabel}</span>
            )}
          </div>
        </div>
        <span className="date-section-count">
          {questions.length} Q{questions.length !== 1 ? 's' : ''}
        </span>
      </button>

      {open && (
        <div className="date-section-body">
          {questions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              isDragging={draggingId === q.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onEdit={onEdit}
              onReschedule={onReschedule}
              onMarkMastered={onMarkMastered}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DateSection

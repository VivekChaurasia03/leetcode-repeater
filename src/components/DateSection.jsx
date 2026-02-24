import { useState } from 'react'
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

function DateSection({ date, dateType, questions, defaultOpen, onEdit, onReschedule, onMarkMastered, onDelete }) {
  const [open, setOpen] = useState(defaultOpen)

  const label    = formatDate(date)
  const dueLabel = getDueLabel(date)

  return (
    <div className={`date-section date-section--${dateType}`}>
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

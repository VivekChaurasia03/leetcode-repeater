import { useState, useRef, useEffect } from 'react'
import TaskCard from './TaskCard.jsx'
import './TaskSection.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function dateToISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()

  const todayStr = dateToISO(today)
  if (dateStr === todayStr) return 'Today'

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (dateStr === dateToISO(yesterday)) return 'Yesterday'

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (dateStr === dateToISO(tomorrow)) return 'Tomorrow'

  const dayName   = DAYS[date.getDay()]
  const monthName = MONTHS[month - 1]
  return `${dayName}, ${monthName} ${day}, ${year}`
}

function TaskSection({ date, dateType, tasks, allDone, defaultOpen, draggingId, onDragStart, onDragEnd, onDropTask, onToggle, onEdit, onReschedule, onDelete }) {
  const [open, setOpen]             = useState(defaultOpen)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  useEffect(() => {
    if (!draggingId) { dragCounter.current = 0; setIsDragOver(false) }
  }, [draggingId])

  useEffect(() => {
    if (isDragOver && !open) setOpen(true)
  }, [isDragOver])

  const handleDragOver  = (e) => {
    if (!e.dataTransfer.types.includes('application/x-task-id')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const handleDragEnter = (e) => {
    if (!e.dataTransfer.types.includes('application/x-task-id')) return
    e.preventDefault()
    dragCounter.current++
    if (dragCounter.current === 1) setIsDragOver(true)
  }
  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('application/x-task-id')
    if (taskId) onDropTask(taskId)
  }

  const label    = formatDate(date)
  const doneCount = tasks.filter(t => t.done).length

  const sectionClass = [
    'task-section',
    allDone ? 'task-section--alldone' : `task-section--${dateType}`,
    isDragOver ? 'task-section--dragover' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={sectionClass}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button className="task-section-header" onClick={() => setOpen(o => !o)}>
        <div className="task-section-header-left">
          <span className={`task-section-chevron ${open ? 'open' : ''}`}>›</span>
          <span className="task-section-label">{label}</span>
          {allDone && <span className="task-section-alldone-badge">All done</span>}
        </div>
        <span className="task-section-count">
          {doneCount}/{tasks.length} done
        </span>
      </button>

      {open && (
        <div className="task-section-body">
          {tasks.map(t => (
            <TaskCard
              key={t.id}
              task={t}
              isDragging={draggingId === t.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onToggle={onToggle}
              onEdit={onEdit}
              onReschedule={onReschedule}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TaskSection

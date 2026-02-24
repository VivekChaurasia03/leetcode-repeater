import { useState, useEffect, useRef } from 'react'
import './DatePicker.css'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa']

function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseISO(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function DatePicker({ id, value, onChange }) {
  const todayISO = toISO(new Date())
  const parsed   = parseISO(value)

  const [open, setOpen]           = useState(false)
  const [viewYear, setViewYear]   = useState(parsed?.getFullYear()  ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth()     ?? new Date().getMonth())
  const [posUp, setPosUp]         = useState(false)
  const wrapperRef = useRef(null)
  const popoverRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Decide whether to open upward (avoid going off-screen)
  useEffect(() => {
    if (!open || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setPosUp(spaceBelow < 310)
  }, [open])

  // Sync view when value changes externally
  useEffect(() => {
    const p = parseISO(value)
    if (p) { setViewYear(p.getFullYear()); setViewMonth(p.getMonth()) }
  }, [value])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // 42-cell grid starting from the Sunday before the 1st
  const startDow   = new Date(viewYear, viewMonth, 1).getDay()
  const gridStart  = new Date(viewYear, viewMonth, 1 - startDow)
  const cells      = Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
  )

  const displayValue = value
    ? parseISO(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="dp-wrapper" ref={wrapperRef}>
      {/* ── Trigger ── */}
      <button
        id={id}
        type="button"
        className={`dp-trigger ${!value ? 'dp-trigger--empty' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg className="dp-cal-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="1.5" y="3" width="13" height="11.5" rx="2" />
          <path d="M1.5 7h13M5 1.5v3M11 1.5v3" />
        </svg>
        <span>{displayValue ?? 'Pick a date'}</span>
        <svg className="dp-chevron" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d={open ? 'M1 5L5 1 9 5' : 'M1 1L5 5 9 1'} />
        </svg>
      </button>

      {/* ── Popover ── */}
      {open && (
        <div
          ref={popoverRef}
          className={`dp-popover ${posUp ? 'dp-popover--up' : ''}`}
          role="dialog"
          aria-label="Calendar"
        >
          {/* Header */}
          <div className="dp-header">
            <button type="button" className="dp-nav" onClick={prevMonth} aria-label="Previous month">‹</button>
            <span className="dp-month-label">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="dp-nav" onClick={nextMonth} aria-label="Next month">›</button>
          </div>

          {/* Weekday labels */}
          <div className="dp-weekdays">
            {DOW.map(d => <span key={d}>{d}</span>)}
          </div>

          {/* Day grid */}
          <div className="dp-grid">
            {cells.map((date, i) => {
              const iso        = toISO(date)
              const isOther    = date.getMonth() !== viewMonth
              const isSelected = iso === value
              const isToday    = iso === todayISO
              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    'dp-day',
                    isOther    ? 'dp-day--other'    : '',
                    isSelected ? 'dp-day--selected' : '',
                    isToday    ? 'dp-day--today'    : '',
                  ].filter(Boolean).join(' ')}
                  tabIndex={isOther ? -1 : 0}
                  onClick={() => { onChange(iso); setOpen(false) }}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker

import { useState, useEffect } from 'react'

// Helper: Get today's date in local timezone (YYYY-MM-DD format)
function getTodayLocal() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const save = async (newData) => {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    })
    if (!res.ok) throw new Error('Failed to save data')
    setData(newData)
  }

  const getUserData = (userName) => {
    if (!data) return null
    return data.users.find(u => u.name === userName)
  }

  const addQuestion = async (userName, number, scheduledDate, meta = {}) => {
    const newData = JSON.parse(JSON.stringify(data))
    const user = newData.users.find(u => u.name === userName)
    user.questions.push({
      id: crypto.randomUUID(),
      number,
      scheduledDate,
      addedDate: getTodayLocal(),
      status: 'pending',
      title: meta.title ?? null,
      difficulty: meta.difficulty ?? null,
      slug: meta.slug ?? null,
      notes: meta.notes ?? '',
    })
    await save(newData)
  }

  const rescheduleQuestion = async (userName, questionId, newDate) => {
    const newData = JSON.parse(JSON.stringify(data))
    const user = newData.users.find(u => u.name === userName)
    const q = user.questions.find(q => q.id === questionId)
    q.scheduledDate = newDate
    await save(newData)
  }

  const markMastered = async (userName, questionId) => {
    const newData = JSON.parse(JSON.stringify(data))
    const user = newData.users.find(u => u.name === userName)
    const q = user.questions.find(q => q.id === questionId)
    q.status = 'mastered'
    await save(newData)
  }

  const unmarkMastered = async (userName, questionId) => {
    const newData = JSON.parse(JSON.stringify(data))
    const user = newData.users.find(u => u.name === userName)
    const q = user.questions.find(q => q.id === questionId)
    q.status = 'pending'
    await save(newData)
  }

  const editQuestion = async (userName, questionId, newNumber) => {
    const newData = JSON.parse(JSON.stringify(data))
    const user = newData.users.find(u => u.name === userName)
    const q = user.questions.find(q => q.id === questionId)
    q.number = newNumber
    await save(newData)
  }

  const deleteQuestion = async (userName, questionId) => {
    const newData = JSON.parse(JSON.stringify(data))
    const user = newData.users.find(u => u.name === userName)
    user.questions = user.questions.filter(q => q.id !== questionId)
    await save(newData)
  }

  const saveNotes = async (userName, questionId, notes) => {
    const newData = JSON.parse(JSON.stringify(data))
    const user = newData.users.find(u => u.name === userName)
    const q = user.questions.find(q => q.id === questionId)
    q.notes = notes
    await save(newData)
  }

  return {
    data,
    loading,
    error,
    getUserData,
    addQuestion,
    rescheduleQuestion,
    markMastered,
    unmarkMastered,
    editQuestion,
    deleteQuestion,
    saveNotes,
  }
}

export { getTodayLocal }

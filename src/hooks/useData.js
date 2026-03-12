import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

function getTodayLocal() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useData() {
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [userId, setUserId]       = useState(null)
  const [questions, setQuestions] = useState([])
  const [tasks, setTasks]         = useState([])
  const [faqRows, setFaqRows]     = useState([])

  // Resolve userId from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('lc-user')
    if (saved) {
      const { id } = JSON.parse(saved)
      if (id) setUserId(id)
      else setLoading(false)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) loadAll(userId)
  }, [userId])

  const loadAll = async (uid) => {
    setLoading(true)
    try {
      const [{ data: qs, error: e1 }, { data: ts, error: e2 }, { data: fs, error: e3 }] = await Promise.all([
        supabase.from('questions').select('*').eq('user_id', uid),
        supabase.from('tasks').select('*').eq('user_id', uid),
        supabase.from('faqs').select('*').order('position', { ascending: true }),
      ])
      if (e1 || e2 || e3) throw new Error(e1?.message || e2?.message || e3?.message)
      setQuestions(qs || [])
      setTasks(ts || [])
      setFaqRows(fs || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Returns user data in the same shape Dashboard.jsx expects
  const getUserData = (_userName) => ({
    questions: questions.filter(q => q.status !== 'dismissed').map(q => ({
      id:            q.id,
      number:        q.number,
      scheduledDate: q.scheduled_date,
      addedDate:     q.added_date,
      status:        q.status,
      title:         q.title,
      difficulty:    q.difficulty,
      slug:          q.slug,
      url:           q.url,
      notes:         q.notes ?? '',
    })),
    tasks: tasks.map(t => ({
      id:        t.id,
      date:      t.date,
      header:    t.header,
      notes:     t.notes ?? '',
      done:      t.done,
      addedDate: t.added_date,
    })),
  })

  // ── Question mutations ────────────────────────────────────────────────────────

  const addQuestion = async (_userName, number, scheduledDate, meta = {}) => {
    if (questions.some(q => q.number === number)) return false
    const { data } = await supabase.from('questions').insert({
      user_id:        userId,
      number,
      scheduled_date: scheduledDate,
      added_date:     getTodayLocal(),
      status:         'pending',
      title:          meta.title       ?? null,
      difficulty:     meta.difficulty  ?? null,
      slug:           meta.slug        ?? null,
      url:            meta.url         ?? null,
      notes:          meta.notes       ?? '',
    }).select().single()
    if (data) setQuestions(prev => [...prev, data])
    return true
  }

  const rescheduleQuestion = async (_userName, questionId, newDate) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, scheduled_date: newDate } : q))
    await supabase.from('questions').update({ scheduled_date: newDate }).eq('id', questionId)
  }

  const markMastered = async (_userName, questionId) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, status: 'mastered' } : q))
    await supabase.from('questions').update({ status: 'mastered' }).eq('id', questionId)
  }

  const unmarkMastered = async (_userName, questionId) => {
    const today = getTodayLocal()
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, status: 'pending', scheduled_date: today } : q))
    await supabase.from('questions').update({ status: 'pending', scheduled_date: today }).eq('id', questionId)
  }

  const editQuestion = async (_userName, questionId, newNumber, meta = {}) => {
    const updates = { number: newNumber }
    if (meta.title)      updates.title      = meta.title
    if (meta.difficulty) updates.difficulty = meta.difficulty
    if (meta.slug)       updates.slug       = meta.slug
    if (meta.url)        updates.url        = meta.url
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q))
    await supabase.from('questions').update(updates).eq('id', questionId)
  }

  const deleteQuestion = async (_userName, questionId) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId))
    await supabase.from('questions').delete().eq('id', questionId)
  }

  const saveNotes = async (_userName, questionId, notes) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, notes } : q))
    await supabase.from('questions').update({ notes }).eq('id', questionId)
  }

  // ── FAQ functions ─────────────────────────────────────────────────────────────

  const getAllFAQs = () => {
    const userNumbers = new Set(questions.map(q => q.number))
    const faqs = {}
    for (const faq of faqRows) {
      if (userNumbers.has(faq.number)) continue
      if (!faqs[faq.company]) faqs[faq.company] = []
      faqs[faq.company].push({
        id:         faq.id,
        number:     faq.number,
        title:      faq.title,
        difficulty: faq.difficulty,
        slug:       faq.slug,
        url:        faq.url,
      })
    }
    return faqs
  }

  const _findFAQRaw = (faqId) =>
    faqRows.find(f => String(f.id) === String(faqId))

  const rescheduleFAQ = async (_userName, company, faqId, scheduledDate, notes = '') => {
    const faq = _findFAQRaw(faqId)
    if (!faq) return
    if (!questions.some(q => q.number === faq.number)) {
      const { data } = await supabase.from('questions').insert({
        user_id:        userId,
        number:         faq.number,
        scheduled_date: scheduledDate,
        added_date:     getTodayLocal(),
        status:         'pending',
        title:          faq.title,
        difficulty:     faq.difficulty,
        slug:           faq.slug,
        url:            faq.url,
        notes:          notes || '',
      }).select().single()
      if (data) setQuestions(prev => [...prev, data])
    }
  }

  const masterFAQ = async (_userName, company, faqId) => {
    const faq = _findFAQRaw(faqId)
    if (!faq) return
    if (!questions.some(q => q.number === faq.number)) {
      const { data } = await supabase.from('questions').insert({
        user_id:        userId,
        number:         faq.number,
        scheduled_date: getTodayLocal(),
        added_date:     getTodayLocal(),
        status:         'mastered',
        title:          faq.title,
        difficulty:     faq.difficulty,
        slug:           faq.slug,
        url:            faq.url,
        notes:          '',
      }).select().single()
      if (data) setQuestions(prev => [...prev, data])
    }
  }

  const deleteFAQ = async (company, faqId) => {
    const faq = _findFAQRaw(faqId)
    if (!faq) return
    if (!questions.some(q => q.number === faq.number)) {
      const { data } = await supabase.from('questions').insert({
        user_id:        userId,
        number:         faq.number,
        scheduled_date: getTodayLocal(),
        added_date:     getTodayLocal(),
        status:         'dismissed',
        title:          faq.title,
        difficulty:     faq.difficulty,
        slug:           faq.slug,
        url:            faq.url,
        notes:          '',
      }).select().single()
      if (data) setQuestions(prev => [...prev, data])
    }
  }

  const saveFAQNotes = async () => {} // no-op: faqs table has no notes column

  // ── Task mutations ────────────────────────────────────────────────────────────

  const addTask = async (_userName, date, header, notes = '') => {
    const { data } = await supabase.from('tasks').insert({
      user_id:    userId,
      date,
      header,
      notes,
      done:       false,
      added_date: getTodayLocal(),
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
  }

  const deleteTask = async (_userName, taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  const toggleTask = async (_userName, taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t))
    await supabase.from('tasks').update({ done: !task.done }).eq('id', taskId)
  }

  const rescheduleTask = async (_userName, taskId, newDate) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, date: newDate } : t))
    await supabase.from('tasks').update({ date: newDate }).eq('id', taskId)
  }

  const editTask = async (_userName, taskId, updates) => {
    const dbUpdates = {}
    if (updates.header !== undefined) dbUpdates.header = updates.header
    if (updates.notes  !== undefined) dbUpdates.notes  = updates.notes
    if (updates.date   !== undefined) dbUpdates.date   = updates.date
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...dbUpdates } : t))
    await supabase.from('tasks').update(dbUpdates).eq('id', taskId)
  }

  return {
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
    getAllFAQs,
    rescheduleFAQ,
    masterFAQ,
    deleteFAQ,
    saveFAQNotes,
    addTask,
    deleteTask,
    toggleTask,
    rescheduleTask,
    editTask,
  }
}

export { getTodayLocal }

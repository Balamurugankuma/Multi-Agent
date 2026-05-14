// ============================================================
//  hooks/useTasks.js
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { taskAPI } from '../api/api'

export function useTasks(params = {}) {
  const [tasks,   setTasks  ] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError  ] = useState(null)

  const fetch = useCallback(async (overrides = {}) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await taskAPI.getAll({ ...params, ...overrides })
      setTasks(data.tasks)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (payload) => {
    const { data } = await taskAPI.create(payload)
    setTasks(prev => [data.task, ...prev])
    return data.task
  }, [])

  const update = useCallback(async (id, payload) => {
    const { data } = await taskAPI.update(id, payload)
    setTasks(prev => prev.map(t => t._id === id ? data.task : t))
    return data.task
  }, [])

  const updateStatus = useCallback(async (id, status) => {
    const { data } = await taskAPI.updateStatus(id, status)
    setTasks(prev => prev.map(t => t._id === id ? data.task : t))
    return data.task
  }, [])

  const remove = useCallback(async (id) => {
    await taskAPI.delete(id)
    setTasks(prev => prev.filter(t => t._id !== id))
  }, [])

  return { tasks, loading, error, refetch: fetch, create, update, updateStatus, remove }
}

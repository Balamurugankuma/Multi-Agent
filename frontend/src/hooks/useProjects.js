// ============================================================
//  hooks/useProjects.js
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { projectAPI } from '../api/api'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading,  setLoading ] = useState(true)
  const [error,    setError   ] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await projectAPI.getAll()
      setProjects(data.projects)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (payload) => {
    const { data } = await projectAPI.create(payload)
    setProjects(prev => [data.project, ...prev])
    return data.project
  }, [])

  const update = useCallback(async (id, payload) => {
    const { data } = await projectAPI.update(id, payload)
    setProjects(prev => prev.map(p => p._id === id ? data.project : p))
    return data.project
  }, [])

  const remove = useCallback(async (id) => {
    await projectAPI.delete(id)
    setProjects(prev => prev.filter(p => p._id !== id))
  }, [])

  return { projects, loading, error, refetch: fetch, create, update, remove }
}

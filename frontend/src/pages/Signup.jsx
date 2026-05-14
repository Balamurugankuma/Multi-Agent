import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Signup is combined with Login page using tabs
export default function Signup() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/login?tab=signup', { replace: true }) }, [])
  return null
}

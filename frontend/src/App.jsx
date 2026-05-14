// ══════════════════════════════════════════════════════════
//  App.jsx  —  Velverse AI + TaskFlow  v4.0
//  All routes: Velverse AI pages + TaskFlow kanban board
// ══════════════════════════════════════════════════════════
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home           from './pages/Home'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import Dashboard      from './pages/Dashboard'
import Pricing        from './pages/Pricing'
import Billing        from './pages/Billing'
import Community      from './pages/Community'
import SuccessStories from './pages/SuccessStories'
import Tasks          from './pages/Tasks'           // ← TaskFlow

import SoftwareDev      from './squads/SoftwareDev'
import SquadGame        from './pages/SquadGame'
import WebDev           from './squads/WebDev'
import UIUX             from './squads/UIUX'
import DigitalMarketing from './squads/DigitalMarketing'
import DataAnalysis     from './squads/DataAnalysis'

// Routes that use full-screen layouts (no top navbar/footer)
const NO_NAV_ROUTES = ['/dashboard', '/tasks']

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function Layout() {
  const loc     = useLocation()
  const isAuth  = ['/login','/signup'].includes(loc.pathname)
  const isFullScreen = NO_NAV_ROUTES.some(r => loc.pathname.startsWith(r))
  const hideNav = isAuth || isFullScreen

  return (
    <>
      <ScrollToTop />
      {!hideNav && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/signup"         element={<Signup />} />
        <Route path="/pricing"        element={<Pricing />} />
        <Route path="/community"      element={<Community />} />
        <Route path="/success-stories" element={<SuccessStories />} />

        {/* Protected — Velverse AI */}
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/billing"        element={<Billing />} />

        {/* Protected — TaskFlow (new) */}
        <Route path="/tasks"          element={<Tasks />} />

        {/* Squad Game */}
        <Route path="/game"           element={<SquadGame />} />

        {/* AI Squads */}
        <Route path="/squads/software"  element={<SoftwareDev />} />
        <Route path="/squads/web"       element={<WebDev />} />
        <Route path="/squads/uiux"      element={<UIUX />} />
        <Route path="/squads/marketing" element={<DigitalMarketing />} />
        <Route path="/squads/data"      element={<DataAnalysis />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  )
}

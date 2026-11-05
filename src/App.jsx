import { useState, useEffect, useCallback } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, cachedBrand } from './context/AuthContext'
import { ViewProvider } from './context/ViewContext'
import { ClassesProvider } from './context/ClassesContext'
import { FeedbackProvider } from './context/Feedback'
import { RequireAuth, PublicOnly, RequireRole } from './routes/guards'
import { ThemeProvider } from './context/ThemeContext'
import { safeBrand } from './lib/brand'
import Splash from './components/layout/Splash'
import AppShell from './components/layout/AppShell'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import ForcePasswordPage from './features/auth/ForcePasswordPage'
import DashboardPage from './features/dashboard/DashboardPage'
import ClassesPage from './features/classes/ClassesPage'
import ClasseDetailPage from './features/classes/ClasseDetailPage'
import ElevePage from './features/eleves/ElevePage'
import NotesPage from './features/notes/NotesPage'
import ResultsPage from './features/results/ResultsPage'
import BulletinsPage from './features/results/BulletinsPage'
import TeamPage from './features/team/TeamPage'
import AccountPage from './features/account/AccountPage'

// Applique la couleur de l’établissement à toute l’interface
function useBrand() {
  const { school } = useAuth()
  const brand = school?.brand || cachedBrand()?.brand
  useEffect(() => {
    const b = safeBrand(brand)
    document.documentElement.style.setProperty('--brand', b)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', b)
  }, [brand])
}

function Routing() {
  useBrand()
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<ForcePasswordPage />} />
        <Route element={<ClassesProvider><AppShell /></ClassesProvider>}>
          <Route index element={<DashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:id" element={<ClasseDetailPage />} />
          <Route path="classes/:cid/eleves/:eid" element={<ElevePage />} />
          <Route path="notes" element={<RequireRole roles={['admin', 'teacher']}><NotesPage /></RequireRole>} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="bulletins" element={<BulletinsPage />} />
          <Route path="team" element={<RequireRole roles={['admin', 'staff']}><TeamPage /></RequireRole>} />
          <Route path="account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const [splash, setSplash] = useState(true)
  const endSplash = useCallback(() => setSplash(false), [])
  return (
    <ThemeProvider>
    <FeedbackProvider>
      <AuthProvider>
        <ViewProvider>
          {splash && <Splash onDone={endSplash} />}
          <HashRouter><Routing /></HashRouter>
        </ViewProvider>
      </AuthProvider>
    </FeedbackProvider>
    </ThemeProvider>
  )
}

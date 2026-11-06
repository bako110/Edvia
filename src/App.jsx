import { useState, useEffect, useCallback } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, cachedBrand } from './context/AuthContext'
import { ViewProvider } from './context/ViewContext'
import { ClassesProvider } from './context/ClassesContext'
import { FeedbackProvider } from './context/Feedback'
import { RequireAuth, PublicOnly, RequireRole } from './routes/guards'
import { ThemeProvider } from './context/ThemeContext'
import { applyBrand } from './lib/brand'
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
import GestionPage from './features/gestion/GestionPage'
import InscriptionsPage from './features/inscriptions/InscriptionsPage'
import FraisPage from './features/frais/FraisPage'
import VieScolairePage from './features/vie/VieScolairePage'
import EmploiPage from './features/emploi/EmploiPage'
import ParentsPage from './features/parents/ParentsPage'
import DevoirsPage from './features/devoirs/DevoirsPage'
import VerifierPage from './features/verify/VerifierPage'
import AuditPage from './features/audit/AuditPage'
import AccompagnementPage from './features/accompagnement/AccompagnementPage'
import AccountPage from './features/account/AccountPage'

// Applique la couleur de l’établissement à toute l’interface
function useBrand() {
  const { school } = useAuth()
  const brand = school?.brand || cachedBrand()?.brand
  useEffect(() => { applyBrand(brand) }, [brand])
}

function Routing({ splash }) {
  useBrand()
  return (
    <Routes>
      <Route path="/verifier" element={<VerifierPage />} />
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
          <Route path="gestion" element={<RequireRole roles={['admin', 'staff']}><GestionPage /></RequireRole>} />
          <Route path="inscriptions" element={<RequireRole roles={['admin', 'staff']}><InscriptionsPage /></RequireRole>} />
          <Route path="frais" element={<RequireRole roles={['admin', 'staff']}><FraisPage /></RequireRole>} />
          <Route path="vie-scolaire" element={<RequireRole roles={['admin', 'staff']}><VieScolairePage /></RequireRole>} />
          <Route path="emploi-du-temps" element={<EmploiPage />} />
          <Route path="parents" element={<RequireRole roles={['admin', 'staff']}><ParentsPage /></RequireRole>} />
          <Route path="devoirs" element={<DevoirsPage />} />
          <Route path="audit" element={<RequireRole roles={['admin', 'staff']}><AuditPage /></RequireRole>} />
          <Route path="accompagnement" element={<AccompagnementPage />} />
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
          <HashRouter><Routing splash={splash} /></HashRouter>
        </ViewProvider>
      </AuthProvider>
    </FeedbackProvider>
    </ThemeProvider>
  )
}

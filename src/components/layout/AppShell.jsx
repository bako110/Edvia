import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import TabBar from './TabBar'
import { ArchiveBanner } from './YearSwitch'
import DesktopShell from './DesktopShell'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useMedia } from '../../hooks/useMedia'
import { tabsFor } from '../../config/navigation'

// Deux interfaces distinctes : web (≥ 1024 px, menu latéral) et mobile / tablette (barre d’onglets en bas)
export default function AppShell() {
  const desktop = useMedia('(min-width: 1024px)')
  const { user } = useAuth()
  const { fullAccess } = useClasses()
  const { pathname } = useLocation()
  if (desktop) return <DesktopShell />
  return (
    <div className="app">
      <Header />
      <main className="main page" key={pathname}>
        <ArchiveBanner />
        <Outlet />
        <p className="pagefoot noprint">EDVIA · Gestion scolaire au Burkina Faso</p>
      </main>
      <TabBar tabs={tabsFor(user.role, fullAccess.length > 0)} />
    </div>
  )
}

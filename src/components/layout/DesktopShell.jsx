import { useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { ArchiveBanner } from './YearSwitch'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { tabsFor } from '../../config/navigation'

const KEY = 'edvia_menu'   // 'open' | 'rail' | 'closed' — préférence mémorisée sur l'appareil
const read = () => { try { return localStorage.getItem(KEY) || 'open' } catch { return 'open' } }

// Interface web (grand écran) : menu latéral repliable + barre supérieure + contenu en colonnes
export default function DesktopShell() {
  const { user } = useAuth()
  const { fullAccess } = useClasses()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(read)
  const choose = useCallback(m => { setMenu(m); try { localStorage.setItem(KEY, m) } catch { /* ignore */ } }, [])
  // bouton de la barre : ouvert → fermé → ouvert ; le menu réduit (icônes) se règle depuis le menu lui-même
  const toggle = useCallback(() => choose(menu === 'closed' ? 'open' : 'closed'), [menu, choose])

  return (
    <div className={'app desk menu-' + menu}>
      <Sidebar tabs={tabsFor(user.role, fullAccess.length > 0)} mode={menu} onMode={choose} />
      <div className="dcol">
        <Topbar menu={menu} onToggle={toggle} />
        <main className="dmain page" key={pathname}>
          <ArchiveBanner />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

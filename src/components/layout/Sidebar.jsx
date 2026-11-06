import { NavLink, Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import SchoolMark from '../ui/SchoolMark'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/Feedback'
import YearSwitch from './YearSwitch'
import { ROLE, initials } from './Header'

// Menu latéral de l’interface web : ouvert, réduit (icônes seules) ou fermé
export default function Sidebar({ tabs, mode, onMode }) {
  const { user, school, logout } = useAuth()
  const confirm = useConfirm()
  const rail = mode === 'rail'
  const out = async () => { if (await confirm({ ok: 'Se déconnecter', title: 'Se déconnecter ?', text: 'Vos notes sont enregistrées automatiquement.' })) logout() }
  const link = (to, icon, label, end) => (
    <NavLink to={to} end={end} title={rail ? label : undefined} aria-label={label}
      className={({ isActive }) => 'side-link' + (isActive ? ' on' : '')}>
      <Icon name={icon} size={20} /><span className="side-txt">{label}</span>
    </NavLink>
  )

  return (
    <aside className="side noprint" aria-hidden={mode === 'closed'} inert={mode === 'closed' ? '' : undefined}>
      <div className="side-brand">
        <SchoolMark logo={school.logo} size={rail ? 44 : 52} />
        <div className="side-txt">
          <div className="side-name">{school.name}</div>
          <YearSwitch />
        </div>
      </div>

      <nav className="side-nav" aria-label="Navigation principale">
        <div className="side-label side-txt">Menu</div>
        {tabs.map(t => <span key={t.to + t.label} className="side-item">{link(t.to, t.icon, t.label, t.end)}</span>)}
        <div className="side-label side-txt">Compte</div>
        {link('/account', 'settings', user.role === 'admin' ? 'Paramètres' : 'Mon compte')}
      </nav>

      <div className="side-foot">
        <Link to="/account" className="side-user" title={rail ? user.name : undefined}>
          <span className="side-avatar">{initials(user.name)}</span>
          <div className="side-txt"><b>{user.name}</b><span>{ROLE[user.role]}</span></div>
        </Link>
        <button className="side-out" onClick={out} title={rail ? 'Déconnexion' : undefined} aria-label="Déconnexion">
          <Icon name="logout" size={18} /><span className="side-txt">Déconnexion</span>
        </button>
        <button className="side-fold" onClick={() => onMode(rail ? 'open' : 'rail')} aria-label={rail ? 'Agrandir le menu' : 'Réduire le menu'} title={rail ? 'Agrandir le menu' : 'Réduire le menu'}>
          <Icon name={rail ? 'chev-right' : 'chev-left'} size={18} /><span className="side-txt">Réduire le menu</span>
        </button>
        <div className="side-by side-txt">EDVIA · Burkina Faso</div>
      </div>
    </aside>
  )
}

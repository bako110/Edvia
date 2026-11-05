import { NavLink, useLocation } from 'react-router-dom'
import Icon from '../ui/Icon'

export default function TabBar({ tabs }) {
  const { pathname } = useLocation()
  const active = t => (t.end ? pathname === t.to : pathname.startsWith(t.to))
  const idx = tabs.findIndex(active)
  return (
    <footer className="ftr noprint">
      <nav className="tabs" aria-label="Navigation principale" style={{ '--i': Math.max(idx, 0), '--n': tabs.length }}>
        {idx >= 0 && <span className="ind" aria-hidden="true" />}
        {tabs.map(t => (
          <NavLink key={t.to + t.label} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <Icon name={t.icon} size={22} /><span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </footer>
  )
}

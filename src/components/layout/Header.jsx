import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import Picker from '../ui/Picker'
import SchoolMark from '../ui/SchoolMark'
import { useAuth } from '../../context/AuthContext'
import { useSelectors } from '../../hooks/useSelectors'

export const ROLE = { admin: 'Administrateur', teacher: 'Enseignant', staff: 'Personnel' }
export const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

// En-tête de l’interface mobile / tablette
export default function Header() {
  const { user, school } = useAuth()
  const sel = useSelectors()
  return (
    <header className="hdr noprint">
      <div className="hdr-top">
        <SchoolMark logo={school.logo} size={42} id="hd" />
        <div className="hdr-t">
          <div className="hdr-k">EDVIA</div>
          <h1>{school.name}</h1>
          <div className="hdr-sub">Année {school.annee} · {ROLE[user.role]}</div>
        </div>
        <Link to="/account" className="hdr-avatar" aria-label="Mon compte">{initials(user.name) || <Icon name="user" size={20} />}</Link>
      </div>
      {sel && (
        <div className="hdr-sel">
          {sel.classes && <Picker variant="head" label="Classe" title="Choisir une classe" columns={3} {...sel.classes} />}
          <Picker variant="head" label="Période" title="Choisir la période" {...sel.period} />
        </div>
      )}
    </header>
  )
}

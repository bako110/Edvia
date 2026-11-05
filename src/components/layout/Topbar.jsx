import { useLocation, Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import Picker from '../ui/Picker'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSelectors } from '../../hooks/useSelectors'
import { titleFor } from '../../config/navigation'
import { initials } from './Header'

const THEME_ICON = { auto: 'auto', light: 'sun', dark: 'moon' }
const THEME_NAME = { auto: 'automatique', light: 'clair', dark: 'sombre' }

// Barre supérieure de l’interface web : bouton du menu + titre de la page + sélecteurs + thème
export default function Topbar({ menu, onToggle }) {
  const { user } = useAuth()
  const { theme, cycle } = useTheme()
  const { pathname } = useLocation()
  const sel = useSelectors()
  const t = titleFor(pathname)
  const closed = menu === 'closed'

  return (
    <header className="topbar noprint">
      <div className="topbar-l">
        <button className="topbar-btn" onClick={onToggle} aria-expanded={!closed}
          aria-label={closed ? 'Ouvrir le menu' : 'Fermer le menu'} title={closed ? 'Ouvrir le menu' : 'Fermer le menu'}>
          <Icon name={closed ? 'menu' : 'panel'} size={20} />
        </button>
        <div className="topbar-t">
          <h1>{t.title}</h1>
          <p>{t.sub}</p>
        </div>
      </div>
      <div className="topbar-r">
        {sel?.classes && <Picker variant="bar" label="Classe" title="Choisir une classe" columns={3} {...sel.classes} />}
        {sel && <Picker variant="bar" label="Période" title="Choisir la période" {...sel.period} />}
        <button className="topbar-btn" onClick={cycle} aria-label={`Thème : ${THEME_NAME[theme]}. Changer`} title={`Thème : ${THEME_NAME[theme]}`}>
          <Icon name={THEME_ICON[theme]} size={20} />
        </button>
        <Link to="/account" className="topbar-avatar" aria-label="Mon compte" title={user.name}>{initials(user.name)}</Link>
      </div>
    </header>
  )
}

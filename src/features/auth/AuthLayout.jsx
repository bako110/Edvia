import SchoolMark from '../../components/ui/SchoolMark'
import Icon from '../../components/ui/Icon'
import { cachedBrand } from '../../context/AuthContext'

const FEATS = [
  'Les professeurs saisissent les notes de leur matière',
  'Moyennes, rangs et mentions calculés automatiquement',
  'Bulletins prêts à imprimer, aux couleurs de l’école',
]

// Cadre des écrans non connectés. Sur grand écran : panneau de présentation + formulaire.
export default function AuthLayout({ title, subtitle, children, footer }) {
  const b = cachedBrand()
  const name = b?.name || 'EDVIA'
  return (
    <div className="auth">
      <aside className="auth-side">
        <SchoolMark logo={b?.logo} size={76} id="as" />
        <h2>{name}</h2>
        <p>{b?.slogan || 'La gestion scolaire simple et fiable, pensée pour les établissements du Burkina Faso.'}</p>
        <ul className="auth-feats">{FEATS.map(f => <li key={f}><Icon name="checkc" size={20} />{f}</li>)}</ul>
      </aside>
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-brand">
            <SchoolMark logo={b?.logo} size={64} id="au" />
            <div className="auth-name">{name}</div>
            <div className="mut">{b?.slogan || 'Gestion scolaire · Burkina Faso'}</div>
          </div>
          <h1>{title}</h1>
          {subtitle && <p className="mut auth-sub">{subtitle}</p>}
          {children}
          {footer && <div className="auth-foot">{footer}</div>}
        </div>
      </div>
      <div className="splash-flag"><i /><i /><i /></div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'

// Pôle de gestion de l'administration : chaque tuile ouvre un module, toujours organisé par classe
const MODULES = [
  { to: '/inscriptions', icon: 'users', t: 'Inscriptions', d: 'Dossiers, parents, effectifs et places par classe.' },
  { to: '/frais', icon: 'wallet', t: 'Frais de scolarité', d: 'Montants, modalités de paiement, versements et impayés par classe.' },
  { to: '/vie-scolaire', icon: 'clock', t: 'Absences et retards', d: 'Suivi par classe, justification des absences.' },
  { to: '/emploi-du-temps', icon: 'calendar', t: 'Emplois du temps', d: 'Cours de chaque classe, sans conflit de salle ni d’enseignant.' },
  { to: '/parents', icon: 'chat', t: 'Communication avec les parents', d: 'SMS, WhatsApp ou e-mail : toute l’école, une classe, ou les impayés.', roles: ['admin', 'staff'] },
  { to: '/devoirs', icon: 'lock', t: 'Devoirs déposés', d: 'Fichiers chiffrés par les professeurs : ouverts avec le code qu’ils vous donnent.' },
  { to: '/audit', icon: 'shield', t: 'Journal d’audit', d: 'Toutes les modifications de notes, pénalités, paiements et comptes : qui, quand, d’où.' },
  { to: '/accompagnement', icon: 'spark', t: 'Accompagnement des élèves', d: 'Assistant pédagogique : élèves en difficulté et pistes d’aide.' },
]

export default function GestionPage() {
  const { user } = useAuth()
  return (
    <div className="hub">
      {MODULES.filter(m => !m.roles || m.roles.includes(user.role)).map((m, i) => (
        <Link to={m.to} className="hub-card" key={m.to} style={{ '--k': i }}>
          <span className="hub-ic"><Icon name={m.icon} size={24} /></span>
          <div><b>{m.t}</b><div className="mut">{m.d}</div></div>
          <Icon name="chev-right" size={18} className="hub-go" />
        </Link>
      ))}
    </div>
  )
}

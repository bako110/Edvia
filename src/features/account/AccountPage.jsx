import Icon from '../../components/ui/Icon'
import ChangePasswordForm from '../auth/ChangePasswordForm'
import SchoolIdentity from './SchoolIdentity'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/Feedback'
import { useTheme } from '../../context/ThemeContext'

const ROLE = { admin: 'Administrateur', teacher: 'Enseignant', staff: 'Personnel administratif' }
const THEMES = [['auto', 'Auto', 'auto'], ['light', 'Clair', 'sun'], ['dark', 'Sombre', 'moon']]

export default function AccountPage() {
  const { theme, setTheme } = useTheme()
  const { user, school, logout, isAdmin } = useAuth()
  const confirm = useConfirm()
  const out = async () => { if (await confirm({ ok: 'Se déconnecter', title: 'Se déconnecter ?', text: 'Vos notes sont enregistrées automatiquement.' })) logout() }

  return <div className={'acc-grid' + (isAdmin ? '' : ' solo')}>
    {isAdmin && <div><SchoolIdentity /></div>}
    <div>
    <section className="card profile">
      <span className="avatar xl">{user.name[0]}</span>
      <div>
        <h2 style={{ margin: 0 }}>{user.name}</h2>
        <div className="mut">@{user.login} · {ROLE[user.role]}</div>
        <div className="mut">{school.name}</div>
      </div>
    </section>

    <section className="card">
      <h2><Icon name="sun" /> Apparence</h2>
      <div className="seg">
        {THEMES.map(([k, l, ic]) => (
          <button key={k} className={theme === k ? 'on' : ''} onClick={() => setTheme(k)}><Icon name={ic} size={16} /> {l}</button>
        ))}
      </div>
    </section>

    <section className="card">
      <h2><Icon name="key" /> Changer mon mot de passe</h2>
      <ChangePasswordForm />
    </section>

    <button className="btn danger-o block" onClick={out}><Icon name="logout" size={16} /> Se déconnecter</button>
    </div>
  </div>
}

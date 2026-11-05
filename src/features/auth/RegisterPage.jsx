import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import ServerSwitch from './ServerSwitch'
import Icon from '../../components/ui/Icon'
import { Field, PasswordField } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { suggestLogin } from '../../lib/adapters'

// Inscription d’un établissement : crée l’école et son compte administrateur
export default function RegisterPage() {
  const { register } = useAuth()
  const [f, setF] = useState({ school: '', name: '', login: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (f.password !== f.confirm) return setError('Les deux mots de passe ne correspondent pas')
    setError(''); setBusy(true)
    try { await register({ school: f.school, name: f.name, login: f.login || suggestLogin(f.name), password: f.password }) }
    catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <AuthLayout title="Enregistrer mon établissement"
      subtitle="Vous deviendrez l’administrateur : vous créerez les classes, puis les comptes des enseignants."
      footer={<>Déjà inscrit ? <Link to="/login">Se connecter</Link></>}>
      <form onSubmit={submit} className="auth-form">
        <Field label="Nom de l’établissement" value={f.school} onChange={set('school')} placeholder="Lycée Provincial de Ouahigouya" required />
        <Field label="Votre nom" value={f.name} onChange={set('name')} placeholder="Prénom NOM" required />
        <Field label="Identifiant de connexion" value={f.login} onChange={set('login')} placeholder={suggestLogin(f.name) || 'prenom.nom'}
          autoCapitalize="none" hint="Lettres, chiffres, point ou tiret (3 caractères minimum)" />
        <PasswordField label="Mot de passe" value={f.password} onChange={set('password')} autoComplete="new-password" hint="8 caractères minimum" required />
        <PasswordField label="Confirmer le mot de passe" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" required />
        {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}
        <button className="btn p block" disabled={busy}><Icon name="check" size={18} /> {busy ? 'Création…' : 'Créer mon établissement'}</button>
      </form>
      <ServerSwitch />
    </AuthLayout>
  )
}

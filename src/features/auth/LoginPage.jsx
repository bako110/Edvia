import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import ServerSwitch from './ServerSwitch'
import Icon from '../../components/ui/Icon'
import { Field, PasswordField } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setBusy(true)
    try { await login(form.login.trim(), form.password) }
    catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <AuthLayout title="Connexion" subtitle="Entrez l’identifiant et le mot de passe remis par l’administration de votre établissement."
      footer={<>Votre établissement n’est pas encore inscrit ? <Link to="/register">Enregistrer mon établissement</Link></>}>
      <form onSubmit={submit} className="auth-form">
        <Field label="Identifiant" value={form.login} onChange={set('login')} autoComplete="username" autoCapitalize="none" autoFocus required />
        <PasswordField label="Mot de passe" value={form.password} onChange={set('password')} autoComplete="current-password" required />
        {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}
        <button className="btn p block" disabled={busy || !form.login || !form.password}>
          <Icon name="lock" size={18} /> {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <ServerSwitch />
    </AuthLayout>
  )
}

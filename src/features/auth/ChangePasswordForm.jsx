import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import { PasswordField } from '../../components/ui/Field'
import { authApi, setToken } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/Feedback'

// Formulaire partagé : changement forcé (mot de passe provisoire) et page « Mon compte »
export default function ChangePasswordForm({ onDone, submitLabel = 'Changer le mot de passe' }) {
  const { passwordChanged } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ old: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (f.password !== f.confirm) return setError('Les deux mots de passe ne correspondent pas')
    setError(''); setBusy(true)
    try {
      const r = await authApi.changePassword(f.old, f.password)
      if (r?.token) setToken(r.token)   // les anciennes sessions sont révoquées : on garde la nôtre
      passwordChanged(); toast('Mot de passe modifié')
      setF({ old: '', password: '', confirm: '' })
      onDone?.()
    } catch (err) { setError(err.message) }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="auth-form">
      <PasswordField label="Mot de passe actuel" value={f.old} onChange={set('old')} autoComplete="current-password" required />
      <PasswordField label="Nouveau mot de passe" value={f.password} onChange={set('password')} autoComplete="new-password" hint="8 caractères minimum, avec au moins une lettre et un chiffre" required />
      <PasswordField label="Confirmer le nouveau mot de passe" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" required />
      {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}
      <button className="btn p block" disabled={busy || !f.old || !f.password}><Icon name="key" size={18} /> {busy ? 'Enregistrement…' : submitLabel}</button>
    </form>
  )
}

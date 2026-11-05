import { useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import ChangePasswordForm from './ChangePasswordForm'
import { useAuth } from '../../context/AuthContext'

// Premier accès : l’administrateur a fixé un mot de passe provisoire, il faut en choisir un personnel
export default function ForcePasswordPage() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <AuthLayout title="Choisissez votre mot de passe"
      subtitle={`Bonjour ${user.name}. Pour votre sécurité, remplacez le mot de passe provisoire reçu par un mot de passe que vous seul connaissez.`}
      footer={<button className="btn link" onClick={logout}>Se déconnecter</button>}>
      <ChangePasswordForm onDone={() => nav('/', { replace: true })} submitLabel="Enregistrer et continuer" />
    </AuthLayout>
  )
}

import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/ui/Logo'
import { useAuth } from '../context/AuthContext'

function Boot() {
  const [slow, setSlow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSlow(true), 3000); return () => clearTimeout(t) }, [])
  return (
    <div className="boot">
      <Logo size={72} id="boot" />
      {slow && <p className="boot-msg">Connexion au serveur…<br /><span>Le serveur en ligne peut mettre jusqu’à une minute à se réveiller.</span></p>}
    </div>
  )
}

// Pages réservées aux utilisateurs connectés ; impose le changement du mot de passe provisoire
export function RequireAuth() {
  const { status, user } = useAuth()
  const { pathname } = useLocation()
  if (status === 'loading') return <Boot />
  if (status === 'anon') return <Navigate to="/login" replace />
  if (user.mustChange && pathname !== '/change-password') return <Navigate to="/change-password" replace />
  return <Outlet />
}

// Pages réservées aux visiteurs (connexion, inscription)
export function PublicOnly() {
  const { status } = useAuth()
  if (status === 'loading') return <Boot />
  return status === 'ready' ? <Navigate to="/" replace /> : <Outlet />
}

// Pages réservées à certains profils
export function RequireRole({ roles, children }) {
  const { user } = useAuth()
  return roles.includes(user.role) ? children : <Navigate to="/" replace />
}

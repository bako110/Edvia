import { useAuth } from '../../context/AuthContext'
import AdminDashboard from './AdminDashboard'
import TeacherDashboard from './TeacherDashboard'

// L’accueil dépend du profil : l’administration pilote l’école, l’enseignant voit ses matières
export default function DashboardPage() {
  const { user } = useAuth()
  return user.role === 'teacher' ? <TeacherDashboard /> : <AdminDashboard />
}

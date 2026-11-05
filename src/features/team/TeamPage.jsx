import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async } from '../../components/ui/Common'
import { Field } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useToast, useConfirm } from '../../context/Feedback'
import { useAsync } from '../../hooks/useAsync'
import { useRun } from '../../hooks/useRun'
import { usersApi } from '../../api'
import { suggestLogin, tempPassword } from '../../lib/adapters'

const ROLES = [
  { value: 'teacher', label: 'Enseignant', sub: 'Saisit les notes de ses matières' },
  { value: 'staff', label: 'Personnel administratif', sub: 'Consulte tout, gère les élèves' },
  { value: 'admin', label: 'Administrateur', sub: 'Accès complet' },
]
const roleLabel = r => ROLES.find(x => x.value === r)?.label || r

// Fiche d’accès à remettre à la personne (affichée une seule fois)
function AccessSlip({ slip, school, onClose }) {
  const toast = useToast()
  const text = `${school}\nCompte : ${slip.name}\nIdentifiant : ${slip.login}\nMot de passe provisoire : ${slip.password}\n(à changer à la première connexion)`
  const copy = async () => { try { await navigator.clipboard.writeText(text); toast('Accès copiés') } catch { toast('Copie impossible — notez les accès', 'err') } }
  return (
    <section className="card slip">
      <h2><Icon name="key" /> Accès à communiquer</h2>
      <div className="slip-box">
        <div><span className="mut">Nom</span><b>{slip.name}</b></div>
        <div><span className="mut">Identifiant</span><b>{slip.login}</b></div>
        <div><span className="mut">Mot de passe provisoire</span><b className="mono">{slip.password}</b></div>
      </div>
      <p className="mut">Ce mot de passe ne sera plus affiché. La personne devra en choisir un nouveau dès sa première connexion.</p>
      <div className="act">
        <button className="btn p" onClick={copy}><Icon name="copy" size={16} /> Copier</button>
        <button className="btn" onClick={() => window.print()}><Icon name="print" size={16} /> Imprimer</button>
        <button className="btn" onClick={onClose}>Fermer</button>
      </div>
    </section>
  )
}

function NewAccount({ onCreated }) {
  const run = useRun()
  const [f, setF] = useState({ name: '', login: '', role: 'teacher', password: tempPassword() })
  const login = f.login || suggestLogin(f.name)
  const create = async () => {
    const r = await run(() => usersApi.create({ name: f.name, login, role: f.role, password: f.password }), 'Compte créé')
    if (r) { onCreated({ name: f.name, login, password: f.password }); setF({ name: '', login: '', role: 'teacher', password: tempPassword() }) }
  }
  return (
    <section className="card">
      <h2><Icon name="plus" /> Nouveau compte</h2>
      <Field label="Nom complet" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Prénom NOM" />
      <div className="row">
        <Field label="Identifiant" value={f.login} onChange={e => setF({ ...f, login: e.target.value })} placeholder={suggestLogin(f.name) || 'prenom.nom'} autoCapitalize="none" />
        <div className="field"><label>Profil</label>
          <Picker label="Profil" title="Profil du compte" value={f.role} options={ROLES} onChange={role => setF({ ...f, role })} /></div>
      </div>
      <label>Mot de passe provisoire</label>
      <div className="pwgen">
        <input className="mono" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        <button className="btn" onClick={() => setF({ ...f, password: tempPassword() })} type="button"><Icon name="key" size={16} /> Générer</button>
      </div>
      <div className="act">
        <button className="btn p" disabled={!f.name.trim() || !login || f.password.length < 8} onClick={create}><Icon name="plus" size={16} /> Créer le compte</button>
      </div>
    </section>
  )
}

export default function TeamPage() {
  const { user, school } = useAuth()
  const isAdmin = user.role === 'admin'
  const { data: users, loading, error, reload } = useAsync(usersApi.list)
  const run = useRun(), confirm = useConfirm()
  const [slip, setSlip] = useState(null)

  const toggle = async u => {
    if (u.active && !(await confirm({ danger: true, ok: 'Désactiver', title: `Désactiver ${u.name} ?`, text: 'Cette personne ne pourra plus se connecter. Ses notes déjà saisies sont conservées.' }))) return
    if (await run(() => usersApi.update(u.id, { active: !u.active }), u.active ? 'Compte désactivé' : 'Compte réactivé')) reload()
  }
  const reset = async u => {
    if (!(await confirm({ ok: 'Réinitialiser', title: `Nouveau mot de passe pour ${u.name} ?`, text: 'Un mot de passe provisoire sera généré. L’ancien ne fonctionnera plus.' }))) return
    const password = tempPassword()
    if (await run(() => usersApi.resetPassword(u.id, password))) { setSlip({ name: u.name, login: u.login, password }); reload() }
  }

  return <>
    <div className={'team-grid' + (isAdmin ? '' : ' solo')}>
    {isAdmin && <div>
      {slip && <AccessSlip slip={slip} school={school.name} onClose={() => setSlip(null)} />}
      <NewAccount onCreated={s => { setSlip(s); reload() }} />
    </div>}

    <Async loading={loading} error={error} onRetry={reload}>
      <section className="card">
        <h2><Icon name="users" /> Équipe <span className="count">{users?.length}</span></h2>
        <div className="ulist">
          {users?.map((u, i) => (
            <div className={'urow' + (u.active ? '' : ' off')} key={u.id} style={{ '--k': Math.min(i, 10) }}>
              <span className="avatar">{u.name[0]}</span>
              <div className="uinfo">
                <b>{u.name}</b>
                <div className="mut">@{u.login} · {roleLabel(u.role)}{u.role === 'teacher' && ` · ${u.nbMatieres} matière${u.nbMatieres > 1 ? 's' : ''}`}</div>
                <div>{!u.active && <span className="tag ko">désactivé</span>} {u.mustChange && <span className="tag gold">mot de passe provisoire</span>}
                  {u.role === 'teacher' && u.active && u.nbMatieres === 0 && <span className="tag gold">sans matière</span>}</div>
              </div>
              {isAdmin && u.id !== user.id && (
                <div className="uact">
                  <button className="btn icon-btn sm" onClick={() => reset(u)} aria-label={`Réinitialiser le mot de passe de ${u.name}`} title="Nouveau mot de passe"><Icon name="key" size={16} /></button>
                  <button className="btn icon-btn sm" onClick={() => toggle(u)} aria-label={u.active ? `Désactiver ${u.name}` : `Réactiver ${u.name}`} title={u.active ? 'Désactiver' : 'Réactiver'}><Icon name={u.active ? 'lock' : 'check'} size={16} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </Async>
    </div>
  </>
}

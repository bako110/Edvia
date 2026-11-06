import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { Field } from '../../components/ui/Field'
import { request } from '../../api/client'
import { PERIODS } from '../../lib/calc'
import AuthLayout from '../auth/AuthLayout'

// Page PUBLIQUE : vérifie qu'un bulletin papier est authentique (le code est imprimé en bas du bulletin)
export default function VerifierPage() {
  const [q] = useSearchParams()
  const [ref, setRef] = useState(q.get('r') || '')
  const [code, setCode] = useState(q.get('c') || '')
  const [period, setPeriod] = useState(q.get('p') || '0')
  const [res, setRes] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const check = async e => {
    e.preventDefault()
    setBusy(true); setError(''); setRes(null)
    try { setRes(await request('GET', `/verify?ref=${encodeURIComponent(ref.trim())}&p=${period}&code=${encodeURIComponent(code.trim())}`, undefined, { auth: false })) }
    catch (err) { setError(err.message) }
    setBusy(false)
  }

  return (
    <AuthLayout title="Vérifier un bulletin" subtitle="Saisissez la référence et le code d’authenticité imprimés en bas du bulletin."
      footer={<Link to="/login" className="btn link">Retour à la connexion</Link>}>
      <form onSubmit={check} className="auth-form">
        <Field label="Référence de l’élève" value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="XXXX-XXXX" className="mono" autoCapitalize="none" spellCheck={false} />
        <Field label="Code d’authenticité" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX" autoCapitalize="characters" spellCheck={false} />
        <div className="field"><label>Période du bulletin</label>
          <select value={period} onChange={e => setPeriod(e.target.value)}>{PERIODS.map((p, i) => <option key={i} value={i}>{p}</option>)}</select></div>
        {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}
        <button className="btn p block" disabled={busy || !ref.trim() || !code.trim()}><Icon name="shield" size={18} /> {busy ? 'Vérification…' : 'Vérifier'}</button>
      </form>
      {res?.valid && (
        <div className="alert ok" role="status"><Icon name="checkc" size={20} />
          <div><b>Bulletin authentique</b><br />{res.eleve} · {res.classe} · {PERIODS[res.period]} · {res.annee}<br /><span className="mut">{res.ecole}</span>
            <br /><span className="mut">Vérifiez que ces informations correspondent au document présenté.</span></div></div>
      )}
      {res && !res.valid && (
        <div className="alert err" role="alert"><Icon name="alert" size={20} />
          <div><b>Code non reconnu</b><br />Ce bulletin n’est pas authentique, a été modifié, ou a été remplacé par une version plus récente. Contactez l’établissement.</div></div>
      )}
    </AuthLayout>
  )
}

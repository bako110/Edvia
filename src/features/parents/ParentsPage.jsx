import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Empty } from '../../components/ui/Common'
import { Field } from '../../components/ui/Field'
import { useClasses } from '../../context/ClassesContext'
import { useAsync } from '../../hooks/useAsync'
import { useClasse } from '../../hooks/useClasse'
import { useRun } from '../../hooks/useRun'
import { messagesApi } from '../../api'
import { mailLink, smsLink, waLink } from '../../lib/money'

const AUDIENCES = [
  { value: 'classe', label: 'Les parents d’une classe', sub: 'Tous les élèves de la classe' },
  { value: 'ecole', label: 'Toute l’école', sub: 'Tous les parents de l’établissement' },
  { value: 'impayes', label: 'Parents en retard de paiement', sub: 'Relance de la scolarité' },
  { value: 'eleve', label: 'Un parent', sub: 'Un seul élève' },
]
const CHANNELS = [{ value: 'sms', label: 'SMS', icon: 'phone' }, { value: 'whatsapp', label: 'WhatsApp', icon: 'chat' }, { value: 'email', label: 'E-mail', icon: 'mail' }]
const TEMPLATES = [
  { l: 'Réunion de parents', a: ['classe', 'ecole', 'eleve'], t: 'Bonjour {parent}, {ecole} invite les parents de {classe} à une réunion le … à … h. Votre présence est importante pour le suivi de {eleve}. Merci.' },
  { l: 'Rappel de scolarité', a: ['impayes', 'eleve'], t: 'Bonjour {parent}, un solde de scolarité de {solde} reste à régler pour {eleve} ({classe}). Merci de passer à l’administration de {ecole} ou de nous contacter pour convenir d’un échéancier.' },
  { l: 'Absence', a: ['eleve', 'classe'], t: 'Bonjour {parent}, {eleve} était absent(e) aujourd’hui. Merci de nous en indiquer le motif et de fournir un justificatif. {ecole}' },
  { l: 'Information', a: ['classe', 'ecole', 'eleve'], t: 'Bonjour {parent}, information de {ecole} : … Merci.' },
]
const VARS = ['{parent}', '{eleve}', '{classe}', '{solde}', '{ecole}']
const dt = d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const AUD_LABEL = { classe: 'Classe', ecole: 'École', impayes: 'Impayés', eleve: 'Un parent' }

function History({ data }) {
  if (!data.length) return <p className="mut">Aucun message préparé pour le moment.</p>
  return (
    <ul className="vie-list">
      {data.map(m => (
        <li key={m.id}>
          <Icon name={CHANNELS.find(c => c.value === m.channel)?.icon || 'chat'} size={18} />
          <div><b>{AUD_LABEL[m.audience]}{m.classe ? ` · ${m.classe}` : ''}</b> <span className="mut">· {m.recipients} parent{m.recipients > 1 ? 's' : ''}</span>
            <div className="mut clamp">{m.body}</div><div className="mut">{dt(m.at)} · {m.byName}</div></div>
        </li>
      ))}
    </ul>
  )
}

export default function ParentsPage() {
  const { classes } = useClasses()
  const { state } = useLocation()
  const run = useRun()
  const [audience, setAudience] = useState(state?.audience || 'classe')
  const [classeId, setClasseId] = useState(state?.classeId || '')
  const [eleveId, setEleveId] = useState(state?.eleveId || '')
  const [channel, setChannel] = useState('sms')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState(state?.body || '')
  const [result, setResult] = useState(null)
  const [done, setDone] = useState(() => new Set())
  const history = useAsync(messagesApi.history)

  const cid = classes.some(c => c.id === classeId) ? classeId : (audience === 'impayes' || audience === 'ecole' ? '' : classes[0]?.id || '')
  const { classe } = useClasse(audience === 'eleve' ? cid : null)
  const needClass = audience === 'classe' || audience === 'eleve'
  const ready = body.trim().length > 2 && (!needClass || cid) && (audience !== 'eleve' || eleveId)

  const prepare = async () => {
    const r = await run(() => messagesApi.send({ audience, classeId: needClass || (audience === 'impayes' && cid) ? cid : null, eleveId: audience === 'eleve' ? eleveId : null, channel, subject, body }))
    if (r) { setResult({ ...r, channel }); setDone(new Set()); history.reload() }
  }
  const link = r => (result.channel === 'sms' ? smsLink(r.phone, r.text) : result.channel === 'whatsapp' ? waLink(r.phone, r.text) : mailLink(r.email, r.subject || subject, r.text))
  const mark = id => setDone(s => new Set(s).add(id))

  if (!classes.length) return <Empty icon="school" title="Aucune classe" text="Créez d’abord les classes de l’établissement." />
  return <>
    <section className="card">
      <h2><Icon name="chat" /> Nouveau message aux parents</h2>
      <div className="field"><label>Destinataires</label>
        <Picker label="Destinataires" value={audience} options={AUDIENCES} onChange={a => { setAudience(a); setResult(null); setEleveId('') }} /></div>
      {(needClass || audience === 'impayes') && (
        <div className="row mrow">
          <div className="field"><label>Classe</label>
            <Picker label="Classe" value={cid} searchable={classes.length > 8}
              options={[...(audience === 'impayes' ? [{ value: '', label: 'Toutes les classes' }] : []), ...classes.map(c => ({ value: c.id, label: c.name }))]}
              onChange={v => { setClasseId(v); setEleveId(''); setResult(null) }} /></div>
          {audience === 'eleve' && (
            <div className="field"><label>Élève</label>
              <Picker label="Élève" value={eleveId} searchable options={[{ value: '', label: 'Choisir…' }, ...(classe?.eleves || []).map(e => ({ value: e.id, label: e.n, sub: e.parentName || 'parent non renseigné' }))]} onChange={setEleveId} /></div>
          )}
        </div>
      )}

      <label>Canal d’envoi</label>
      <div className="chips">
        {CHANNELS.map(c => <button key={c.value} type="button" className={'chipbtn' + (channel === c.value ? ' on' : '')} onClick={() => { setChannel(c.value); setResult(null) }}><Icon name={c.icon} size={14} /> {c.label}</button>)}
      </div>
      {channel === 'email' && <Field label="Objet" value={subject} onChange={e => setSubject(e.target.value)} maxLength={120} />}

      <label>Modèle</label>
      <div className="chips">
        {TEMPLATES.filter(t => t.a.includes(audience)).map(t => <button key={t.l} type="button" className="chipbtn" onClick={() => setBody(t.t)}>{t.l}</button>)}
      </div>
      <label>Message</label>
      <textarea rows="5" maxLength={1000} value={body} onChange={e => setBody(e.target.value)} placeholder="Écrivez votre message…" />
      <div className="chips vars"><span className="mut">Insérer :</span>
        {VARS.map(v => <button key={v} type="button" className="chipbtn sm" onClick={() => setBody(b => b + (b && !b.endsWith(' ') ? ' ' : '') + v)}>{v}</button>)}
      </div>
      <p className="mut">Chaque parent reçoit le message personnalisé (nom de l’élève, solde…). L’envoi se fait depuis votre téléphone, avec votre propre forfait : aucune passerelle SMS n’est nécessaire.</p>
      <button className="btn p block" disabled={!ready} onClick={prepare}><Icon name="send" size={16} /> Préparer les messages</button>
    </section>

    {result && (
      <section className="card">
        <h2><Icon name="send" /> À envoyer <span className="count">{result.recipients.length}</span></h2>
        {result.recipients.length === 0 && <p className="mut">Aucun parent n’a de {result.channel === 'email' ? 'adresse e-mail' : 'numéro de téléphone'} enregistré(e).</p>}
        {result.recipients.length > 0 && <p className="mut">Touchez « Envoyer » : l’application {result.channel === 'sms' ? 'SMS' : result.channel === 'whatsapp' ? 'WhatsApp' : 'de messagerie'} s’ouvre avec le message prêt. Validez l’envoi dans celle-ci.</p>}
        <ul className="vie-list">
          {result.recipients.map(r => (
            <li key={r.eleveId} className={done.has(r.eleveId) ? 'sent' : ''}>
              <Icon name={done.has(r.eleveId) ? 'checkc' : 'user'} size={18} />
              <div><b>{r.parent || 'Parent'}</b> <span className="mut">· {r.eleve} ({r.classe})</span><div className="mut clamp">{r.text}</div></div>
              <a className="btn sm p" href={link(r)} target={result.channel === 'whatsapp' ? '_blank' : undefined} rel="noreferrer" onClick={() => mark(r.eleveId)}>
                <Icon name="send" size={14} /> {done.has(r.eleveId) ? 'Renvoyer' : 'Envoyer'}</a>
            </li>
          ))}
        </ul>
        {result.missing.length > 0 && (
          <div className="alert warn"><Icon name="alert" size={18} /><div><b>{result.missing.length} parent{result.missing.length > 1 ? 's' : ''} sans {result.channel === 'email' ? 'e-mail' : 'téléphone'} :</b>{' '}
            {result.missing.slice(0, 12).map(m => m.eleve).join(', ')}{result.missing.length > 12 ? '…' : ''}.<br />Complétez-les dans <b>Inscriptions</b>.</div></div>
        )}
      </section>
    )}

    <section className="card">
      <h2><Icon name="clock" /> Messages récents</h2>
      <Async loading={history.loading} error={history.error} onRetry={history.reload}>{history.data && <History data={history.data} />}</Async>
    </section>
  </>
}

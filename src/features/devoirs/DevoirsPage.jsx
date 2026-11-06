import { useRef, useState } from 'react'
import Icon from '../../components/ui/Icon'
import Picker from '../../components/ui/Picker'
import { Async, Empty } from '../../components/ui/Common'
import { Field } from '../../components/ui/Field'
import { useAuth } from '../../context/AuthContext'
import { useClasses } from '../../context/ClassesContext'
import { useConfirm, useToast } from '../../context/Feedback'
import { useAsync } from '../../hooks/useAsync'
import { useClasse } from '../../hooks/useClasse'
import { useRun } from '../../hooks/useRun'
import { devoirsApi } from '../../api'
import { MAX_FILE, decryptFile, encryptFile, fmtSize, makeCode, saveBlob, vaultAvailable } from '../../lib/vault'
import { ClassPick, Sheet, useClassChoice } from '../gestion/shared'

const dt = d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/* ---------- dépôt (enseignant) ---------- */
function Deposit({ classes, onDone }) {
  const { user } = useAuth()
  const toast = useToast()
  const [classeId, setClasseId] = useClassChoice(classes)
  const { classe } = useClasse(classeId)
  const mine = (classe?.matieres || []).filter(m => m.teacherId === user.id)
  const [matiereId, setMatiereId] = useState('')
  const mid = mine.some(m => m.id === matiereId) ? matiereId : mine[0]?.id || ''
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [code, setCode] = useState('')
  const [show, setShow] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const input = useRef(null)

  const pick = e => {
    const f = e.target.files[0]; e.target.value = ''
    if (!f) return
    if (f.size > MAX_FILE) { setError(`Fichier trop volumineux (${fmtSize(f.size)}) : 8 Mo au maximum.`); return }
    setError(''); setFile(f)
  }
  const ready = file && title.trim() && mid && code.length >= 8 && vaultAvailable()

  const submit = async () => {
    setBusy(true); setError('')
    try {
      const sealed = await encryptFile(file, code)                       // chiffré ici, dans le navigateur
      const d = await devoirsApi.create({ classeId, matiereId: mid, title, note, size: sealed.size, salt: sealed.salt, iv: sealed.iv, iter: sealed.iter })
      await devoirsApi.upload(d.id, sealed.data)
      setDone({ title: title.trim(), code, classe: classe.name, matiere: mine.find(m => m.id === mid)?.n })
      setTitle(''); setNote(''); setFile(null); setCode(''); onDone()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const copy = async text => { try { await navigator.clipboard.writeText(text); toast('Copié') } catch { toast('Copie impossible — notez le code', 'err') } }

  if (done) return (
    <section className="card">
      <h2><Icon name="checkc" /> Devoir déposé et chiffré</h2>
      <p><b>{done.title}</b> · {done.classe} · {done.matiere}</p>
      <div className="vault-note"><Icon name="key" size={18} />
        <div><b>Communiquez ce code à l’administration.</b> Il est le seul moyen d’ouvrir le fichier. Il n’est pas enregistré sur le serveur : si vous le perdez, le fichier est définitivement illisible.</div></div>
      <div className="codebox"><input readOnly value={done.code} onFocus={e => e.target.select()} aria-label="Code du dépôt" />
        <button className="btn" onClick={() => copy(`Code du devoir « ${done.title} » (${done.classe}) : ${done.code}`)}><Icon name="copy" size={16} /> Copier</button></div>
      <div className="act"><button className="btn p" onClick={() => setDone(null)}><Icon name="plus" size={16} /> Déposer un autre devoir</button></div>
    </section>
  )

  return (
    <section className="card">
      <h2><Icon name="upload" /> Déposer un devoir</h2>
      <div className="vault-note"><Icon name="lock" size={18} />
        <div>Votre fichier est <b>chiffré dans votre appareil</b> avec le code que vous choisissez, avant d’être envoyé. Même le serveur ne peut pas le lire : seule l’administration, à qui vous donnez le code, pourra l’ouvrir.</div></div>
      {!vaultAvailable() && <div className="alert err"><Icon name="alert" size={18} />Le chiffrement n’est pas disponible sur cette adresse : ouvrez l’application en https ou sur localhost.</div>}
      <div className="row mrow">
        <ClassPick classes={classes} value={classeId} onChange={setClasseId} />
        <div className="field"><label>Matière</label>
          <Picker label="Matière" value={mid} options={mine.length ? mine.map(m => ({ value: m.id, label: m.n })) : [{ value: '', label: 'Aucune matière à vous' }]} onChange={setMatiereId} /></div>
      </div>
      <Field label="Titre du devoir" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex. : Devoir n°1 — 1er trimestre" maxLength={120} />
      <Field label="Remarque (facultatif)" value={note} onChange={e => setNote(e.target.value)} maxLength={300} hint="Visible par l’administration avant l’ouverture du fichier : n’y mettez rien de confidentiel." />
      <label>Fichier (PDF, Word, image… 8 Mo maximum)</label>
      <button type="button" className="filebox" onClick={() => input.current?.click()}>
        <Icon name={file ? 'file' : 'upload'} size={26} />
        <span><b>{file ? file.name : 'Choisir un fichier'}</b><span className="mut">{file ? fmtSize(file.size) : 'Touchez pour sélectionner'}</span></span>
        <input ref={input} type="file" onChange={pick} />
      </button>
      <label>Code du dépôt (vous l’écrivez, 8 caractères minimum)</label>
      <div className="codebox">
        <input type={show ? 'text' : 'password'} value={code} onChange={e => setCode(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-label="Code du dépôt" />
        <button className="btn" type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Masquer' : 'Afficher'}><Icon name={show ? 'eye-off' : 'eye'} size={16} /></button>
        <button className="btn" type="button" onClick={() => { setCode(makeCode()); setShow(true) }}><Icon name="key" size={16} /> Générer</button>
      </div>
      {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}
      <button className="btn p block" disabled={!ready || busy} onClick={submit}><Icon name="lock" size={16} /> {busy ? 'Chiffrement et envoi…' : 'Chiffrer et déposer'}</button>
    </section>
  )
}

/* ---------- ouverture d'un dépôt avec son code ---------- */
function OpenSheet({ d, onClose }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const open = async () => {
    setBusy(true); setError('')
    try {
      const buffer = await devoirsApi.file(d.id)
      const { name, blob } = await decryptFile(buffer, d, code)
      saveBlob(name, blob); toast('Fichier déchiffré et téléchargé'); onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Sheet title={d.title} sub={`${d.classe} · ${d.matiere} · ${d.byName}`} onClose={onClose}>
      <div className="vie-form">
        <div className="vault-note"><Icon name="key" size={18} /><div>Saisissez le code que <b>{d.byName}</b> vous a communiqué. Le fichier est déchiffré sur votre appareil, rien n’est envoyé au serveur.</div></div>
        <label>Code du dépôt</label>
        <input type="password" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} autoFocus
          onKeyDown={e => e.key === 'Enter' && code && !busy && open()} />
        {error && <div className="alert err" role="alert"><Icon name="alert" size={18} />{error}</div>}
        <button className="btn p block" disabled={!code || busy || !d.sealed} onClick={open}><Icon name="download" size={16} /> {busy ? 'Déchiffrement…' : 'Ouvrir et télécharger'}</button>
      </div>
    </Sheet>
  )
}

function List({ data, onChange, canDelete }) {
  const { user } = useAuth()
  const run = useRun(), confirm = useConfirm()
  const [open, setOpen] = useState(null)
  const remove = async d => {
    if (!(await confirm({ danger: true, ok: 'Supprimer', title: `Supprimer « ${d.title} » ?`, text: 'Le fichier chiffré sera définitivement supprimé.' }))) return
    if (await run(() => devoirsApi.remove(d.id), 'Dépôt supprimé')) onChange()
  }
  if (!data.length) return <p className="mut center">Aucun devoir déposé pour le moment.</p>
  return <>
    <ul className="vie-list">
      {data.map(d => (
        <li key={d.id}>
          <Icon name="lock" size={18} />
          <div><b>{d.title}</b>
            <div className="mut"><span className="tag neutral">{d.annee}</span> {d.classe} · {d.matiere}{canDelete ? ` · ${d.byName}` : ''} · {fmtSize(d.size)} · {dt(d.at)}</div>
            {d.note && <div className="mut clamp">{d.note}</div>}
            {!d.sealed && <span className="tag ko">envoi incomplet</span>}</div>
          <button className="btn sm" disabled={!d.sealed} onClick={() => setOpen(d)}><Icon name="key" size={14} /> Ouvrir</button>
          {d.byId === user.id && <button className="btn icon-btn sm" onClick={() => remove(d)} aria-label="Supprimer le dépôt"><Icon name="trash" size={16} /></button>}
        </li>
      ))}
    </ul>
    {open && <OpenSheet d={open} onClose={() => setOpen(null)} />}
  </>
}

export default function DevoirsPage() {
  const { user } = useAuth()
  const { classes } = useClasses()
  const { data, loading, error, reload } = useAsync(devoirsApi.list)
  const teacher = user.role === 'teacher'
  return <>
    {teacher && (classes.length
      ? <Deposit classes={classes} onDone={reload} />
      : <Empty icon="school" title="Aucune classe" text="Aucune classe ne vous est affectée : vous ne pouvez pas encore déposer de devoir." />)}
    <section className="card">
      <h2><Icon name="lock" /> {teacher ? 'Mes dépôts' : 'Devoirs déposés'} {data && <span className="count">{data.length}</span>}</h2>
      {!teacher && <div className="vault-note"><Icon name="key" size={18} /><div>Chaque fichier est chiffré par le professeur. Pour l’ouvrir, demandez-lui le <b>code</b> de son dépôt, puis touchez « Ouvrir ».</div></div>}
      <Async loading={loading} error={error} onRetry={reload}>{data && <List data={data} onChange={reload} canDelete={!teacher} />}</Async>
    </section>
  </>
}

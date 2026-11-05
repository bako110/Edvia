/*
 * Import de listes d’élèves depuis Excel (.xlsx), CSV, texte ou PDF.
 * Les fichiers sont lus dans le navigateur ; seules les bibliothèques nécessaires sont chargées à la demande.
 * Résultat : [{ name, matricule }] à confirmer par l’utilisateur avant enregistrement.
 */
import { toCSV, download } from './files'

const clean = s => String(s ?? '').replace(/[ \s]+/g, ' ').trim()
const L = 'A-Za-zÀ-ÖØ-öø-ÿ'
const NAME_CELL = new RegExp(`^[${L}'’.\\- ]+$`)
const HAS_WORD = new RegExp(`[${L}]{2}`)
const HEAD = /^(n°?|no\.?|num(éro)?|noms?( et pr[ée]noms?)?|pr[ée]noms?|[ée]l[èe]ves?|matricule|sexe|genre|date( de naissance)?|naissance|lieu( de naissance)?|classe|observations?|signature|rang|statut|redoublant|nationalit[ée])$/i
const NOISE = /(liste|ann[ée]e|lyc[ée]e|coll[èe]ge|minist[èe]re|burkina|page|effectif|total|professeur|principal|nombre|imprim|r[ée]publique|direction|province|r[ée]gion|surveillan|scolaire|établissement|etablissement|trimestre)/i
const DATE = /^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/

const isMatricule = c => /^(?=.*\d)[A-Za-z0-9][A-Za-z0-9\-/]{3,}$/.test(c) && !DATE.test(c)
const isNameCell = c => c.length >= 2 && NAME_CELL.test(c) && HAS_WORD.test(c) && !HEAD.test(c) && !/^[MF]$/i.test(c)
const stripNumber = c => c.replace(/^\d+\s*[.)\-:]?\s+(?=\D)/, '')

/* ---------- 1. lecture des fichiers -> lignes de cellules ---------- */

// CSV / texte : détecte le séparateur (; , tabulation) et gère les guillemets
export function parseCSV(text) {
  const first = text.split(/\r?\n/).find(l => l.trim()) || ''
  const sep = [';', '\t', ','].map(s => [s, first.split(s).length]).sort((a, b) => b[1] - a[1])[0][0]
  const rows = []; let row = [], cell = '', q = false
  const push = () => { row.push(cell); cell = '' }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += ch }
    else if (ch === '"') q = true
    else if (ch === sep) push()
    else if (ch === '\n') { push(); rows.push(row); row = [] }
    else if (ch !== '\r') cell += ch
  }
  push(); rows.push(row)
  return rows
}

async function excelRows(file) {
  const { readSheet } = await import('read-excel-file/browser')
  return readSheet(file)   // première feuille
}

// PDF : reconstruit les lignes et les colonnes à partir de la position des textes
async function pdfRows(file) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const rows = []
  for (let p = 1; p <= doc.numPages; p++) {
    const tc = await (await doc.getPage(p)).getTextContent()
    const items = tc.items.filter(i => i.str && i.str.trim()).map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width || 0 }))
    const lines = []
    for (const it of items.sort((a, b) => b.y - a.y)) {
      const l = lines.find(l => Math.abs(l.y - it.y) < 3)
      l ? l.items.push(it) : lines.push({ y: it.y, items: [it] })
    }
    for (const l of lines) {
      l.items.sort((a, b) => a.x - b.x)
      const cells = []; let cur = '', end = null
      for (const it of l.items) {
        const gap = end === null ? 0 : it.x - end
        if (end !== null && gap > 8) { cells.push(cur); cur = it.s }
        else cur += (end !== null && gap > 1.5 && !cur.endsWith(' ') && !it.s.startsWith(' ') ? ' ' : '') + it.s
        end = it.x + it.w
      }
      cells.push(cur)
      rows.push(cells)
    }
  }
  if (!rows.length) throw new Error('Aucun texte lisible dans ce PDF (probablement un document scanné, c’est-à-dire une image). Utilisez un PDF généré par ordinateur, un fichier Excel ou la saisie manuelle.')
  return rows
}

export async function readFileRows(file) {
  const name = file.name.toLowerCase()
  if (file.size > 15 * 1024 * 1024) throw new Error('Fichier trop volumineux (15 Mo maximum)')
  if (name.endsWith('.xlsx')) return excelRows(file)
  if (name.endsWith('.xls')) throw new Error('Le format Excel ancien (.xls) n’est pas lu. Ouvrez-le dans Excel puis « Enregistrer sous » → .xlsx, ou exportez-le en CSV.')
  if (name.endsWith('.pdf')) return pdfRows(file)
  if (name.endsWith('.csv') || name.endsWith('.txt')) return parseCSV(await file.text())
  throw new Error('Format non pris en charge. Utilisez Excel (.xlsx), CSV ou PDF.')
}

/* ---------- 2. lignes de cellules -> élèves ---------- */

function columns(row) {
  const c = row.map(x => clean(x))
  const find = re => c.findIndex(x => re.test(x))
  return {
    full: find(/^(noms?\s*(et|&)\s*pr[ée]noms?|nom complet|[ée]l[èe]ves?)$/i),
    nom: find(/^noms?$/i), pre: find(/^pr[ée]noms?$/i), mat: find(/matricule|^mat\.?$|^code$/i),
  }
}

export function extractEleves(rows) {
  const table = rows.map(r => (r || []).map(clean)).filter(r => r.some(Boolean))
  // ligne d’en-tête : l’une des 15 premières lignes contenant « nom », « prénom » ou « matricule »
  let h = -1, col = null
  for (let i = 0; i < Math.min(15, table.length); i++) {
    const cc = columns(table[i])
    if (cc.full >= 0 || cc.nom >= 0 || cc.pre >= 0) { h = i; col = cc; break }
  }
  const out = []
  const add = (name, matricule) => {
    name = clean(name).replace(/;/g, ' ')
    if (!name || NOISE.test(name) || name.split(' ').length > 7) return
    out.push({ name, matricule: clean(matricule).replace(/;/g, ' ').slice(0, 30) })
  }

  if (col && (col.full >= 0 || col.nom >= 0)) {
    for (const r of table.slice(h + 1)) {
      const name = col.full >= 0 ? r[col.full] : [r[col.nom], col.pre >= 0 ? r[col.pre] : ''].filter(Boolean).join(' ')
      if (name && HAS_WORD.test(name) && !HEAD.test(name)) add(name, col.mat >= 0 ? r[col.mat] : '')
    }
  } else {
    // pas d’en-tête exploitable : on repère noms et matricules ligne par ligne
    for (const raw of table.slice(h >= 0 ? h + 1 : 0)) {
      const numbered = /^\d+[.)]?$/.test(raw[0] || '') || /^\d+\s*[.)\-:]?\s+\D/.test(raw[0] || '')
      const cells = raw.map(stripNumber).filter(Boolean)
      let mat = '', hasNumberCell = numbered
      const names = []
      for (const c of cells) {
        if (/^\d+[.)]?$/.test(c)) { hasNumberCell = true; continue }
        if (isNameCell(c)) names.push(c)
        else if (!mat && isMatricule(c)) mat = c
        else {                                         // « OUEDRAOGO Awa 123456A » dans une seule cellule
          const m = c.match(new RegExp(`^(.*?[${L}])\\s+([A-Za-z0-9][A-Za-z0-9\\-/]{3,})$`))
          if (m && isNameCell(m[1]) && isMatricule(m[2])) { names.push(m[1]); mat = mat || m[2] }
        }
      }
      const name = names.slice(0, 3).join(' ')
      const words = name.split(' ').filter(Boolean).length
      if (words >= 2 || (words === 1 && (mat || hasNumberCell))) add(name, mat)
    }
  }
  // doublons dans le fichier
  const seen = new Set()
  return out.filter(e => { const k = e.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
}

/* ---------- 3. modèle à télécharger ---------- */
export function downloadTemplate() {
  download('modele-liste-eleves.csv', toCSV([
    ['NOM', 'PRENOMS', 'MATRICULE'],
    ['OUEDRAOGO', 'Awa', '123456A'],
    ['SAWADOGO', 'Ibrahim', '123457B'],
  ]), 'text/csv')
}

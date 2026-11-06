/*
 * Client HTTP unique : choix du serveur, jeton, erreurs normalisées, déconnexion si la session expire.
 *
 * Plusieurs serveurs peuvent être déclarés, par ordre de priorité, dans VITE_API_URLS :
 *   VITE_API_URLS=http://localhost:3001/api,https://edvia-backend.onrender.com/api
 * Au démarrage on teste chacun (/health) et on prend le PREMIER qui répond : le serveur local s'il est
 * lancé, sinon le serveur en ligne. Chaque serveur a ses propres comptes : le jeton de session est donc
 * mémorisé séparément pour chacun.
 */
const LIST = String(import.meta.env.VITE_API_URLS || import.meta.env.VITE_API_URL || '/api')
  .split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean)

const PREF_KEY = 'edvia_api_pref'      // 'auto' ou l'adresse choisie à la main
const TOKENS_KEY = 'edvia_tokens'      // { [adresse du serveur]: jeton }

const store = {
  get: k => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* stockage indisponible */ } },
}
export const isLocalUrl = u => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(u)
// « /api » est relayé par Vite vers VITE_PROXY_TARGET : on affiche le vrai serveur (local ou en ligne)
const PROXY = import.meta.env.VITE_PROXY_TARGET || ''
export const labelOf = u => {
  const real = u.startsWith('/') ? (PROXY || '') : u
  if (!real) return 'Serveur de cette page'
  return isLocalUrl(real) ? 'Local (cet ordinateur)' : 'En ligne'
}

/* ---------- choix du serveur ---------- */
let base = null
let ready = null

async function probe(url, ms) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms)
  // L'en-tête Content-Type: application/json impose la même vérification CORS (« preflight ») que les vraies requêtes :
  // un serveur qui répondrait mais refuserait notre origine est donc écarté, au lieu d'être choisi puis de faire échouer la connexion.
  try { return (await fetch(url + '/health', { cache: 'no-store', signal: c.signal, headers: { 'Content-Type': 'application/json' } })).ok }
  catch { return false }
  finally { clearTimeout(t) }
}

// Résout une seule fois le serveur à utiliser. Local : réponse attendue en 1,5 s ; en ligne : jusqu'à 45 s (réveil du serveur).
export function apiReady() {
  if (!ready) {
    ready = (async () => {
      if (LIST.length === 1) return (base = LIST[0])
      const pref = store.get(PREF_KEY)
      const order = pref && pref !== 'auto' && LIST.includes(pref) ? [pref, ...LIST.filter(u => u !== pref)] : LIST
      for (const url of order) if (await probe(url, isLocalUrl(url) ? 1500 : 45000)) return (base = url)
      return (base = order[0])      // rien ne répond : les erreurs seront explicites
    })()
  }
  return ready
}
export const apiBase = () => base
export const apiLabel = () => (base ? labelOf(base) : '')
export const apiCandidates = () => LIST.map(url => ({ url, label: labelOf(url) }))
export const apiPreference = () => store.get(PREF_KEY) || 'auto'
export function selectApi(urlOrAuto) { store.set(PREF_KEY, urlOrAuto); location.reload() }

/* ---------- jeton (un par serveur) ---------- */
const tokens = () => { try { return JSON.parse(store.get(TOKENS_KEY)) || {} } catch { return {} } }
export const getToken = () => (base ? tokens()[base] || null : null)
export function setToken(t) {
  if (!base) return
  const all = tokens()
  if (t) all[base] = t; else delete all[base]
  store.set(TOKENS_KEY, JSON.stringify(all))
}

const listeners = new Set()
export const onUnauthorized = fn => { listeners.add(fn); return () => listeners.delete(fn) }

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

export async function request(method, path, body, { auth = true } = {}) {
  await apiReady()
  const token = getToken()
  let res
  try {
    res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    const online = !isLocalUrl(base) && !base.startsWith('/')
    throw new ApiError(0, online
      ? `Connexion impossible au serveur en ligne. Il est peut-être en train de se réveiller (patientez une minute), ou il n'autorise pas l'adresse de cette page (réglage CORS_ORIGIN du serveur).${LIST.length > 1 ? ' Vous pouvez aussi choisir un autre serveur ci-dessous.' : ''}`
      : `Connexion impossible au serveur local. Vérifiez qu'il est lancé (npm start dans le dossier backend)${LIST.length > 1 ? ', ou choisissez le serveur en ligne ci-dessous' : ''}.`)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && auth && token) listeners.forEach(f => f())
    throw new ApiError(res.status, data?.error || 'Une erreur est survenue')
  }
  return data
}

// Octets bruts (devoirs chiffrés) : envoi et réception sans JSON
async function binary(method, path, body) {
  await apiReady()
  const token = getToken()
  let res
  try {
    res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/octet-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body })
  } catch { throw new ApiError(0, 'Connexion impossible au serveur') }
  if (!res.ok) {
    if (res.status === 401 && token) listeners.forEach(f => f())
    const data = await res.json().catch(() => null)
    throw new ApiError(res.status, data?.error || 'Une erreur est survenue')
  }
  return res
}

export const http = {
  putRaw: async (p, buffer) => (await binary('PUT', p, buffer)).json(),
  getBuffer: async p => (await binary('GET', p)).arrayBuffer(),
  get: p => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b ?? {}),
  del: p => request('DELETE', p),
}

/*
 * Coffre à devoirs : chiffrement de bout en bout, dans le navigateur (WebCrypto).
 * AES-256-GCM ; la clé est dérivée du mot de passe du professeur par PBKDF2-SHA-256 (310 000 tours) avec un sel aléatoire.
 * Le serveur ne reçoit que le texte chiffré : ni le mot de passe, ni le contenu, ni le nom du fichier.
 * Un mot de passe perdu ne peut PAS être récupéré : le fichier est alors illisible pour tout le monde.
 */
export const MAX_FILE = 8 * 1024 * 1024
const ITER = 310_000
const enc = new TextEncoder(), dec = new TextDecoder()

export const vaultAvailable = () => !!(globalThis.crypto && globalThis.crypto.subtle)

const toB64 = bytes => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s) }
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0))

async function deriveKey(password, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

// Chiffre un fichier : le contenu transporte aussi son nom et son type (jamais visibles par le serveur)
export async function encryptFile(file, password) {
  if (!vaultAvailable()) throw new Error('Le chiffrement n’est pas disponible ici : ouvrez l’application en https ou sur localhost.')
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12))
  const meta = enc.encode(JSON.stringify({ name: file.name, type: file.type || 'application/octet-stream' }))
  const body = new Uint8Array(await file.arrayBuffer())
  const plain = new Uint8Array(4 + meta.length + body.length)
  new DataView(plain.buffer).setUint32(0, meta.length)
  plain.set(meta, 4); plain.set(body, 4 + meta.length)
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(password, salt, ITER), plain)
  return { data, salt: toB64(salt), iv: toB64(iv), iter: ITER, size: file.size }
}

// Déchiffre ; un mauvais mot de passe est détecté (la balise d'authentification AES-GCM échoue)
export async function decryptFile(buffer, { salt, iv, iter }, password) {
  if (!vaultAvailable()) throw new Error('Le déchiffrement n’est pas disponible ici : ouvrez l’application en https ou sur localhost.')
  let plain
  try {
    plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, await deriveKey(password, fromB64(salt), iter), buffer))
  } catch { throw new Error('Code incorrect : le fichier n’a pas pu être ouvert.') }
  const len = new DataView(plain.buffer, plain.byteOffset).getUint32(0)
  const meta = JSON.parse(dec.decode(plain.slice(4, 4 + len)))
  return { name: meta.name, blob: new Blob([plain.slice(4 + len)], { type: meta.type }) }
}

export function saveBlob(name, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// Code de dépôt lisible (sans caractères ambigus), à communiquer à l'administration
export function makeCode(len = 10) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const a = new Uint32Array(len); crypto.getRandomValues(a)
  return Array.from(a, x => chars[x % chars.length]).join('')
}

export const fmtSize = n => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`)

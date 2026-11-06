import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()

// Colore la zone de la barre d'état (fond de la fenêtre Android) : couleur de l'établissement + couleur de la page
const hex = c => { const m = c.match(/\d+/g); return m ? '#' + m.slice(0, 3).map(n => Number(n).toString(16).padStart(2, '0')).join('') : '#f3f5fa' }
export function syncNativeBars() {
  if (!isNative || !window.EdviaNative?.setBars) return
  const brand = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#0b2a5e'
  try { window.EdviaNative.setBars(brand, hex(getComputedStyle(document.body).backgroundColor)) } catch { /* ignore */ }
}

// Couleur de la barre d'état Android = couleur de l'établissement (appelée à chaque changement de couleur)
export async function setNativeBrand(color) {
  if (!isNative) return
  const { StatusBar } = await import('@capacitor/status-bar')
  StatusBar.setBackgroundColor({ color }).catch(() => {})
  syncNativeBars()
}

// Icônes de la barre d'état : claires sur un fond de couleur (en-tête, écran de démarrage), sombres sur un fond clair
// (connexion, tablette). Sinon elles disparaissent : blanc sur blanc.
export async function setNativeBarStyle(onColor) {
  if (!isNative) return
  const { StatusBar, Style } = await import('@capacitor/status-bar')
  StatusBar.setStyle({ style: onColor ? Style.Dark : Style.Light }).catch(() => {})
}

// Intégration Android : barre d’état, bouton retour, écran de démarrage. Sans effet dans un navigateur.
export async function initNative() {
  if (!isNative) return
  document.documentElement.classList.add('native')
  const [{ StatusBar, Style }, { App }, { SplashScreen }] = await Promise.all([
    import('@capacitor/status-bar'), import('@capacitor/app'), import('@capacitor/splash-screen'),
  ])
  // L’en-tête est toujours sombre (couleur de l’établissement) : icônes de la barre d’état claires
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
  StatusBar.setBackgroundColor({ color: getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#0b2a5e' }).catch(() => {})
  // la couleur de la page change avec le thème clair / sombre, et les marges avec la rotation
  new MutationObserver(syncNativeBars).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => setTimeout(syncNativeBars, 50))
  addEventListener('resize', () => setTimeout(syncNativeBars, 100))
  setTimeout(syncNativeBars, 300)
  // Bouton « retour » : page précédente, puis quitter depuis l’accueil
  App.addListener('backButton', () => {
    const h = location.hash.replace(/^#/, '')
    if (history.length > 1 && h && h !== '/' && h !== '/login') history.back(); else App.exitApp()
  })
  setTimeout(() => SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {}), 600)
}

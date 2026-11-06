import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/source-serif-4'
import App from './App.jsx'
import './styles/index.css'
import { initNative, isNative } from './native'
import { applyBrand } from './lib/brand'
import { cachedBrand } from './context/AuthContext'

applyBrand(cachedBrand()?.brand)   // couleur de la dernière école connectée sur cet appareil, avant même le premier affichage
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)

// Application installable et utilisable avec une connexion instable (l’API n’est jamais mise en cache)
initNative()
if (!isNative && 'serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {})

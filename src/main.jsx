import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/source-serif-4'
import App from './App.jsx'
import './styles/index.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)

// Application installable et utilisable avec une connexion instable (l’API n’est jamais mise en cache)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {})

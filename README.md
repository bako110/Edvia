# Edvia — application web (React + Vite)

Gestion scolaire pour le Burkina Faso. Backend : https://github.com/bako110/Edvia_backend

## Démarrer
    npm install
    cp .env.example .env
    npm run dev

## Déployer (Render, Static Site)
- Build : `npm install && npm run build`
- Publish directory : `dist`
- Variable : `VITE_API_URLS=https://edvia-backend.onrender.com/api`
- Côté backend, ajouter l'adresse de l'application dans `CORS_ORIGIN`.

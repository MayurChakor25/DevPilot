# DevPilot AI — Client

React + Vite frontend for DevPilot AI. See the [root README](../README.md) for full
setup, environment variable, and deployment instructions.

## Scripts

```bash
npm run dev       # start the Vite dev server on http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build locally
npm run lint       # run oxlint
```

## Structure

```
src/
├── components/   # Reusable UI (chat bubbles, file tree, modals, ui/*)
├── context/      # AuthContext — JWT session management
├── lib/          # Axios API client
├── pages/        # Landing, Login, Register, Dashboard, Repository, Chat
├── App.jsx        # Route definitions
└── main.jsx        # Entry point
```

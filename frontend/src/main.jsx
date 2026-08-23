import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppShell from './components/layout/AppShell.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppShell>
      <App />
    </AppShell>
  </StrictMode>,
)
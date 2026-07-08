import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Automatically wipe out all localStorage data to ensure no persistent storage is used
try {
  localStorage.clear();
} catch (e) {
  console.error('Failed to clear localStorage:', e);
}

// Automatically purge any sessionStorage keys not related to the admin app authentication
const ALLOWED_KEYS = ['adminToken', 'adminUser'];
try {
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key && !ALLOWED_KEYS.includes(key)) {
      sessionStorage.removeItem(key);
    }
  }
} catch (e) {
  console.error('Failed to clean sessionStorage:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

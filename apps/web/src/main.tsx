import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './i18n';
import './styles/globals.css';
import './styles/hydro-theme.css';

// Hydro brand theme is applied to every route. `.dark` is toggled by the
// useTheme hook (light/dark/system); pre-applying it here from localStorage
// avoids a first-paint flash when the user's stored preference is dark.
(function applyPreferredTheme() {
  const root = document.documentElement;
  root.classList.add('theme-hydro');
  const stored = localStorage.getItem('theme');
  const resolved =
    stored === 'dark'
      ? 'dark'
      : stored === 'light'
        ? 'light'
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
  root.classList.toggle('dark', resolved === 'dark');
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

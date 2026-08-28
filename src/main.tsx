import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const isExhibition = window.location.pathname.startsWith('/exhibition')
const Application = lazy(() =>
  isExhibition ? import('./exhibition/ExhibitionApp.tsx') : import('./App.tsx'),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Application />
    </Suspense>
  </StrictMode>,
)

import BanubaFaceTracker from '../widgets/BanubaFaceTracker.jsx'
import { useViewportHeightVariable } from '../lib/useViewportHeight.js'

export default function App() {
  useViewportHeightVariable()

  return (
    <div className="min-h-full">
      <header className="p-4 border-neutral-800">
        <h1 className="text-xl font-semibold">Banuba WebAR (face tracking) + React + Vite + Tailwind</h1>
      </header>
      <main className="p-4">
        <BanubaFaceTracker />
      </main>
    </div>
  )
}

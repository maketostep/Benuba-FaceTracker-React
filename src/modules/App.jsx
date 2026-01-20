import BanubaFaceTracker from "../widgets/BanubaFaceTracker.jsx";
import { useViewportHeightVariable } from "../lib/useViewportHeight.js";

export default function App() {
  useViewportHeightVariable();

  return (
    <div className="min-h-full">
      <header className="p-4 border-neutral-800">
        <h1 className="text-xl font-semibold">
          Banuba WebAR (face tracking) + React + Vite + Tailwind
        </h1>
      </header>
      <main className="p-4">
        <BanubaFaceTracker />
      </main>
      <footer className="bg-white bg-opacity-30 bg-blend-hard-light">
        <div className="p-4 font-bold text-center border-t text-sm text-white">
          <h3>
            <span>&copy; Created by </span>
            <a
              href="https://www.instagram.com/waveweb.studio/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Wave Web Studio
            </a>
          </h3>
          <h3>
            <span>&#128100; Developer </span>
            <a
              href="https://github.com/maketostep"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Mkrtchyan Martun
            </a>
          </h3>
        </div>
      </footer>
    </div>
  );
}

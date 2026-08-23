import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Scene from './components/Scene'
import './App.css'

export default function App() {
  const [selectedGame, setSelectedGame] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isTvOn, setIsTvOn] = useState(false)

  const handleSelect = useCallback((id) => {
    setSelectedGame(id)
    setIsOpen(false)
  }, [])

  const handleDeselect = useCallback(() => {
    setSelectedGame(null)
    setIsOpen(false)
  }, [])

  const handleToggleOpen = useCallback(() => {
    setIsOpen(o => !o)
  }, [])

  const handleToggleTv = useCallback(() => {
    setIsTvOn(on => !on)
  }, [])

  const handlePlayCartridge = useCallback(() => {
    setIsTvOn(true)
  }, [])

  return (
    <div className="app">
      <Canvas
        camera={{ position: [0, 1.2, 9], fov: 44 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        onPointerMissed={handleDeselect}
      >
        <Suspense fallback={null}>
          <Scene
            selectedGame={selectedGame}
            onSelect={handleSelect}
            isOpen={isOpen}
            isTvOn={isTvOn}
            onToggleTv={handleToggleTv}
            onPlayCartridge={handlePlayCartridge}
          />
        </Suspense>
      </Canvas>

      <div className="ui-overlay">
        <div className="header-bar">
          <h1 className="shelf-title">🎮 Retro Game Shelf</h1>
          <button
            className={`tv-status-badge ${isTvOn ? 'tv-on' : 'tv-off'}`}
            onClick={handleToggleTv}
            title="Click to toggle Sony PVM TV"
          >
            <span className="tv-dot"></span>
            SONY PVM-14M4E: {isTvOn ? 'ON' : 'OFF'}
          </button>
        </div>

        {selectedGame && (
          <div className="game-controls">
            <button className="btn" onClick={handleToggleOpen}>
              {isOpen ? '📦 Close Box' : '📦 Open Box'}
            </button>
            <button className="btn btn-secondary" onClick={handleDeselect}>
              ← Back to Shelf
            </button>
            {isOpen ? (
              <p className="hint hint-active">✨ Click cartridge to play on TV</p>
            ) : (
              <p className="hint">Drag to rotate</p>
            )}
          </div>
        )}

        {!selectedGame && (
          <p className="hint no-shelf-hint">
            Click a game to pick up • Click Sony PVM to toggle TV
          </p>
        )}
      </div>
    </div>
  )
}

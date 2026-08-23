import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Scene from './components/Scene'
import './App.css'

export default function App() {
  const [selectedGame, setSelectedGame] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

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
          />
        </Suspense>
      </Canvas>

      <div className="ui-overlay">
        <h1 className="shelf-title">🎮 Retro Game Shelf</h1>

        {selectedGame && (
          <div className="game-controls">
            <button className="btn" onClick={handleToggleOpen}>
              {isOpen ? '📦 Close Box' : '📦 Open Box'}
            </button>
            <button className="btn btn-secondary" onClick={handleDeselect}>
              ← Back to Shelf
            </button>
            <p className="hint">Drag to rotate</p>
          </div>
        )}

        {!selectedGame && (
          <p className="hint no-shelf-hint">Click a game to pick it up</p>
        )}
      </div>
    </div>
  )
}

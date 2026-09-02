import { useState, useCallback, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'
import Scene from './components/Scene'
import './App.css'

function CameraFrameTrigger({ requestId, orbitRef, position, target }) {
  const { camera } = useThree()

  useEffect(() => {
    if (!requestId) return

    camera.position.set(position[0], position[1], position[2])
    camera.lookAt(target[0], target[1], target[2])

    if (orbitRef.current) {
      orbitRef.current.target.set(target[0], target[1], target[2])
      orbitRef.current.update()
    }
  }, [requestId, camera, orbitRef, position, target])

  return null
}

export default function App() {
  const [selectedGame, setSelectedGame] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isTvOn, setIsTvOn] = useState(false)
  const [tvGameId, setTvGameId] = useState('aladdin')
  const [frameGenesisRequest, setFrameGenesisRequest] = useState(0)
  const [resetShelfViewRequest, setResetShelfViewRequest] = useState(0)
  const [renderGenesisAtOrigin, setRenderGenesisAtOrigin] = useState(false)
  const orbitRef = useRef(null)

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

  const handleOpenBox = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleCloseBox = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleToggleTv = useCallback(() => {
    setIsTvOn(on => !on)
  }, [])

  const handlePlayCartridge = useCallback((gameId) => {
    if (gameId) setTvGameId(gameId)
    setIsTvOn(true)
  }, [])


  return (
    <div className="app">
      <Canvas
        camera={{ position: [0, 0.8, 15.5], fov: 62 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        onPointerMissed={handleDeselect}
      >
        <Suspense fallback={null}>
          <Scene
            selectedGame={selectedGame}
            tvGameId={tvGameId}
            renderGenesisAtOrigin={renderGenesisAtOrigin}
            onSelect={handleSelect}
            isOpen={isOpen}
            onOpenBox={handleOpenBox}
            onCloseBox={handleCloseBox}
            isTvOn={isTvOn}
            onToggleTv={handleToggleTv}
            onPlayCartridge={handlePlayCartridge}
          />
        </Suspense>
        <CameraFrameTrigger
          requestId={frameGenesisRequest}
          orbitRef={orbitRef}
          position={[-1.9, 1.85, 2.2]}
          target={[-1.84, 1.30, 0.08]}
        />
        <CameraFrameTrigger
          requestId={resetShelfViewRequest}
          orbitRef={orbitRef}
          position={[0, 0.8, 15.5]}
          target={[0, 0.35, 0]}
        />
        <OrbitControls
          ref={orbitRef}
          makeDefault
          enablePan
          enableZoom
          enableRotate
          target={[0, 0.35, 0]}
          minDistance={4}
          maxDistance={30}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI - 0.12}
          zoomSpeed={0.9}
          panSpeed={0.9}
          rotateSpeed={0.8}
        />
      </Canvas>

      <div className="ui-overlay">
        <div className="header-bar">
          <h1 className="shelf-title">🎮 Retro Game Shelf</h1>
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

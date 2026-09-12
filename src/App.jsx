import { useState, useCallback, useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Scene from './components/Scene'
import './App.css'

const MAIN_SHELF_FOCUS = {
  position: [0, 3.51, -0.15],
  width: 11.04,
  height: 10.2,
}

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

function KeyboardSceneNavigation({ orbitRef }) {
  const { camera } = useThree()

  useEffect(() => {
    const handleKeyDown = (event) => {
      const directions = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, 1],
        ArrowDown: [0, -1],
      }
      const direction = directions[event.key]
      if (!direction || !orbitRef.current) return

      event.preventDefault()
      const distance = 1.25
      const offsetX = direction[0] * distance
      const offsetY = direction[1] * distance

      camera.position.x += offsetX
      camera.position.y += offsetY
      orbitRef.current.target.x += offsetX
      orbitRef.current.target.y += offsetY
      orbitRef.current.update()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [camera, orbitRef])

  return null
}

function SmoothShelfFocus({ focusRequest, orbitRef }) {
  const { camera } = useThree()
  const animationRef = useRef(null)

  useEffect(() => {
    if (!focusRequest || !orbitRef.current) return

    const target = new THREE.Vector3(...focusRequest.position)
    const currentTarget = orbitRef.current.target.clone()
    const cameraDirection = camera.position.clone().sub(currentTarget).normalize()
    const halfVerticalFov = THREE.MathUtils.degToRad(camera.fov / 2)
    const verticalDistance = (focusRequest.height / 2) / Math.tan(halfVerticalFov)
    const horizontalDistance = (focusRequest.width / 2) / (Math.tan(halfVerticalFov) * camera.aspect)
    const fitDistance = Math.max(verticalDistance, horizontalDistance) * 1.15

    animationRef.current = {
      target,
      cameraPosition: target.clone().add(cameraDirection.multiplyScalar(fitDistance)),
    }
  }, [camera, focusRequest, orbitRef])

  useFrame((_, delta) => {
    const animation = animationRef.current
    if (!animation || !orbitRef.current) return

    const easing = 1 - Math.exp(-delta * 5)
    camera.position.lerp(animation.cameraPosition, easing)
    orbitRef.current.target.lerp(animation.target, easing)
    orbitRef.current.update()

    if (
      camera.position.distanceTo(animation.cameraPosition) < 0.01
      && orbitRef.current.target.distanceTo(animation.target) < 0.01
    ) {
      camera.position.copy(animation.cameraPosition)
      orbitRef.current.target.copy(animation.target)
      orbitRef.current.update()
      animationRef.current = null
    }
  })

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
  const [shelfFocus, setShelfFocus] = useState(null)
  const orbitRef = useRef(null)

  const handleSelect = useCallback((id) => {
    setSelectedGame(id)
    setIsOpen(false)
  }, [])

  const handleDeselect = useCallback(() => {
    setSelectedGame(null)
    setIsOpen(false)
    if (selectedGame) setShelfFocus({ ...MAIN_SHELF_FOCUS })
  }, [selectedGame])

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

  const handleShelfFocus = useCallback((position, dimensions, parentFocus) => {
    setSelectedGame(null)
    setIsOpen(false)
    setShelfFocus((currentFocus) => {
      const isSameFocus = currentFocus?.position?.every((value, index) => value === position[index])
      if (isSameFocus && parentFocus) return { ...parentFocus }
      return { position: [...position], ...dimensions }
    })
  }, [])

  const handleGameFocus = useCallback((position, dimensions) => {
    setShelfFocus({ position: [...position], ...dimensions })
  }, [])


  return (
    <div className="app">
      <Canvas
        camera={{ position: [-9.5, 3.8, 27], fov: 42 }}
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
            onShelfFocus={handleShelfFocus}
            onGameFocus={handleGameFocus}
          />
        </Suspense>
        <KeyboardSceneNavigation orbitRef={orbitRef} />
        <SmoothShelfFocus focusRequest={shelfFocus} orbitRef={orbitRef} />
        <CameraFrameTrigger
          requestId={frameGenesisRequest}
          orbitRef={orbitRef}
          position={[-1.9, 1.85, 2.2]}
          target={[-1.84, 1.30, 0.08]}
        />
        <CameraFrameTrigger
          requestId={resetShelfViewRequest}
          orbitRef={orbitRef}
          position={[-9.5, 3.8, 27]}
          target={[-9.5, 3.0, 0]}
        />
        <OrbitControls
          ref={orbitRef}
          makeDefault
          enablePan
          enableZoom
          enableRotate
          target={[-9.5, 3.0, 0]}
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
        {!selectedGame && (
          <p className="hint no-shelf-hint">
            Click a game to pick up • Click Sony PVM to toggle TV
          </p>
        )}
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import * as THREE from 'three'
import GameBox from './GameBox'
import NESModel from './NESModel'
import SegaGenesisModel from './SegaGenesisModel'
import SonyPVM from './SonyPVM'

const GAMES_NES = [
  {
    id: 'super-mario-bros-3',
    // Bottom-left bay, aligned to inner left wall:
    // Left bay center is world x ≈ -3.60; bottom shelf surface is world y ≈ -1.59.
    position: [-3.60, -0.53, 0.0],
    coverFrontUrl: '/textures/systems/nes/covers/front/Super Mario Bros. 3[112].png',
    coverBackUrl: '/textures/systems/nes/covers/back/Super Mario Bros. 3[112].png',
    coverSpineUrl: '/textures/systems/nes/covers/spine/Super Mario Bros. 3[112].png',
    // TODO: Add NES game cart, manual, and screen textures if needed
    // cartUrl: '/textures/Super Mario Bros. 3[112]-cart.png',
    // manualUrl: '/manuals/Super Mario Bros. 3[112]_US_manual.pdf',
    // manualPreviewUrl: '/manuals/Super Mario Bros. 3[112]-manual-page1.png',
    // screenTextureUrl: '/textures/Super Mario Bros. 3[112]-title.png',
  },
]

const GAMES = [
  {
    id: 'aladdin',
    // Bottom-right bay, aligned to inner right wall:
    // Right bay center is world x ≈ 3.60; bottom shelf surface is world y ≈ -1.59.
    position: [2.98, -0.53, 0.0],
    coverUrl: '/textures/aladdin-cover.jpg',
    cartUrl: '/textures/aladdin-cart.png',
    manualUrl: '/manuals/Aladdin_MD_US_manual.pdf',
    manualPreviewUrl: '/manuals/aladdin-manual-page1.png',
    screenTextureUrl: '/textures/aladdin-title.png',
  },
  {
    id: 'thelionking',
    // Bottom-right bay, aligned to inner right wall:
    // Right bay center is world x ≈ 3.60; bottom shelf surface is world y ≈ -1.59.
    position: [3.31, -0.53, 0.0],
    coverUrl: '/textures/thelionking-cover.jpg',
    cartUrl: '/textures/thelionking-cart.png',
    manualUrl: '/manuals/TheLionKing_US_manual.pdf',
    manualPreviewUrl: '',
    screenTextureUrl: '/textures/thelionking-title.png',
  }
]

// ─────────────────────────────────────────────────────────
// Procedural Light Blonde Oak Wood Textures
// ─────────────────────────────────────────────────────────

function createLightOakTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base blonde oak tone (matching IKEA / modern ash oak in reference photo)
  ctx.fillStyle = '#cfc2ad'
  ctx.fillRect(0, 0, 512, 512)

  // Vertical wood grain streaks
  for (let x = 0; x < 512; x += 1) {
    const wave = Math.sin(x * 0.08) * 8 + Math.sin(x * 0.35) * 4 + (Math.random() - 0.5) * 4
    const brightness = 0.93 + (Math.sin(x * 0.04 + wave * 0.08) * 0.07) + (Math.random() - 0.5) * 0.04
    const r = Math.floor(207 * brightness)
    const g = Math.floor(194 * brightness)
    const b = Math.floor(173 * brightness)
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, 0, 1, 512)
  }

  // Wood pores and grain lines
  ctx.fillStyle = 'rgba(150, 136, 118, 0.16)'
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const len = 12 + Math.random() * 40
    ctx.fillRect(x, y, 1.2, len)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function createPegHoleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base oak color
  ctx.fillStyle = '#cfc2ad'
  ctx.fillRect(0, 0, 128, 512)

  // Vertical grain
  for (let x = 0; x < 128; x += 1) {
    const brightness = 0.95 + (Math.random() - 0.5) * 0.08
    const r = Math.floor(207 * brightness)
    const g = Math.floor(194 * brightness)
    const b = Math.floor(173 * brightness)
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, 0, 1, 512)
  }

  // Dual columns of shelf pin adjustment holes
  const drawHoles = (cx) => {
    for (let y = 32; y < 512; y += 32) {
      // Dark inset hole
      ctx.fillStyle = '#5c5244'
      ctx.beginPath()
      ctx.arc(cx, y, 3.2, 0, Math.PI * 2)
      ctx.fill()
      // Highlight bottom rim
      ctx.fillStyle = '#f0e6d6'
      ctx.beginPath()
      ctx.arc(cx, y + 1.2, 3.2, 0, Math.PI)
      ctx.stroke()
    }
  }

  drawHoles(38)
  drawHoles(90)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 2)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

// ─────────────────────────────────────────────────────────
// Main Scene Component
// ─────────────────────────────────────────────────────────

export default function Scene({
  selectedGame,
  tvGameId,
  renderGenesisAtOrigin,
  onSelect,
  isOpen,
  onOpenBox,
  onCloseBox,
  isTvOn,
  onToggleTv,
  onPlayCartridge,
  onShelfFocus,
  onGameFocus,
}) {
  const sortedGames = useMemo(
    () => [...GAMES].sort((a, b) => a.id.localeCompare(b.id)),
    []
  )
  const sortedNesGames = useMemo(
    () => [...GAMES_NES].sort((a, b) => a.id.localeCompare(b.id)),
    []
  )
  const tvGame = GAMES.find((game) => game.id === tvGameId) ?? GAMES[0]

  return (
    <>
      {/* Background color */}
      <color attach="background" args={['#0e0e16']} />
      <fog attach="fog" args={['#0e0e16', 15, 28]} />

      {/* Lighting for light blonde oak wood */}
      <ambientLight intensity={0.70} color="#fffcf5" />
      <directionalLight
        position={[4, 8, 7]}
        intensity={2.6}
        color="#fffbf2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-26}
        shadow-camera-right={8}
        shadow-camera-top={12}
        shadow-camera-bottom={-6}
      />
      {/* Subtle fill from the left */}
      <pointLight position={[-5, 3, 5]} intensity={0.45} color="#d8e8ff" />
      {/* Warm accent from below */}
      <pointLight position={[0, -2, 4]} intensity={0.25} color="#fff0d0" />

      {/* Existing 12-cube shelf */}
      <ShelfUnit onFocus={onShelfFocus} />

      {/* Empty 10-cube shelf for the hardware */}
      <ShelfUnit columns={5} rows={2} position={[-15.30, 0.99, -0.15]} onFocus={onShelfFocus} />

      {/* 3D Sony PVM-14M4E Monitor (sitting on lower shelf in left bay, angled like in photo) */}
      <SonyPVM
        position={[-15.30, 4.8, -0.35]}
        rotation={[0.02, 0.58, 0]}
        isOn={isTvOn}
        onTogglePower={onToggleTv}
        screenTextureUrl={tvGame.screenTextureUrl}
      />

      {/* Sega Genesis console */}
      <SegaGenesisModel
        raw={renderGenesisAtOrigin}
        position={[-11.60, 1.49, 0.2]}
        rotation={[0, 0, 0]}
        scale={1.0}
        modelScale={0.005}
      />

      {/* NES console (upper row of the empty shelf) */}
      <NESModel
        position={[-19.00, 1.23, .5]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.0}
        modelScale={0.015}
      />

      {/* Game boxes (stored spine-out next to TV on lower shelf) */}
      {sortedGames.map(game => (
        <GameBox
          key={game.id}
          gameId={game.id}
          position={game.position}
          coverUrl={game.coverUrl}
          cartUrl={game.cartUrl}
          manualUrl={game.manualUrl}
          manualPreviewUrl={game.manualPreviewUrl}
          isSelected={selectedGame === game.id}
          onSelect={() => {
            onSelect(game.id)
            onGameFocus?.([0, 0.3, 5.2], { width: 1.38, height: 2.0 })
          }}
          isOpen={selectedGame === game.id && isOpen}
          onOpenBox={onOpenBox}
          onCloseBox={onCloseBox}
          onPlayCartridge={onPlayCartridge}
        />
      ))}

      {/* NES game boxes (stored spine-out on bottom-left shelf) */}
      {sortedNesGames.map(game => (
        <GameBox
          key={game.id}
          gameId={game.id}
          system="nes"
          position={game.position}
          coverFrontUrl={game.coverFrontUrl}
          coverBackUrl={game.coverBackUrl}
          coverSpineUrl={game.coverSpineUrl}
          cartUrl={game.cartUrl}
          manualUrl={game.manualUrl}
          manualPreviewUrl={game.manualPreviewUrl}
          isSelected={selectedGame === game.id}
          onSelect={() => {
            onSelect(game.id)
            onGameFocus?.([0, 0.3, 5.2], { width: 1.32, height: 1.86 })
          }}
          isOpen={selectedGame === game.id && isOpen}
          onOpenBox={onOpenBox}
          onCloseBox={onCloseBox}
          onPlayCartridge={onPlayCartridge}
        />
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Scandinavian Light Oak 2-Bay Bookcase
// ─────────────────────────────────────────────────────────

function ShelfUnit({ columns = 3, rows = 4, position = [0, 3.51, -0.15], onFocus }) {
  const oakTex = useMemo(() => createLightOakTexture(), [])
  const pegTex = useMemo(() => createPegHoleTexture(), [])

  const oakMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: oakTex,
    color: '#d4c7b4',
    roughness: 0.78,
    metalness: 0.02,
  }), [oakTex])

  const pegWallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: pegTex,
    color: '#d4c7b4',
    roughness: 0.80,
    metalness: 0.02,
  }), [pegTex])

  const DEPTH = 3.2     // Depth (doubled)
  const THICK = 0.12    // Panel thickness
  const BAY_W = 3.52     // Existing clear bay width
  const CELL_H = 2.40    // Existing clear bay height
  const TOTAL_W = BAY_W * columns + THICK * (columns + 1)
  const TOTAL_H = CELL_H * rows + THICK * (rows + 1)
  const shelfLevels = Array.from({ length: rows + 1 }, (_, index) => (
    -TOTAL_H / 2 + THICK / 2 + index * (CELL_H + THICK)
  ))

  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation()
        onFocus?.(position, { width: TOTAL_W, height: TOTAL_H })
      }}
    >
      {/* ── Back Panel (Light blonde oak backing) ── */}
      <mesh position={[0, 0, -DEPTH / 2 + 0.04]} receiveShadow>
        <boxGeometry args={[TOTAL_W, TOTAL_H, 0.06]} />
        <primitive object={oakMaterial} attach="material" />
      </mesh>

      {/* Individual cubby targets sit behind the objects stored inside them. */}
      {Array.from({ length: rows }, (_, row) => (
        Array.from({ length: columns }, (_, column) => {
          const x = -TOTAL_W / 2 + THICK + BAY_W / 2 + column * (BAY_W + THICK)
          const y = (shelfLevels[row] + shelfLevels[row + 1]) / 2
          const focusPosition = [position[0] + x, position[1] + y, position[2]]

          return (
            <mesh
              key={`${row}-${column}`}
              position={[x, y, -DEPTH / 2 + 0.075]}
              onClick={(event) => {
                event.stopPropagation()
                onFocus?.(
                  focusPosition,
                  { width: BAY_W, height: CELL_H },
                  {
                    position: [...position],
                    width: TOTAL_W,
                    height: TOTAL_H,
                  }
                )
              }}
            >
              <planeGeometry args={[BAY_W, CELL_H]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
            </mesh>
          )
        })
      ))}

      {/* ── Outer Left Upright Wall ── */}
      <mesh position={[-TOTAL_W / 2 + THICK / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[THICK, TOTAL_H, DEPTH]} />
        <primitive object={oakMaterial} attach="material" />
      </mesh>
      {/* Left Wall Inner Peg-hole Overlay */}
      <mesh
        position={[-TOTAL_W / 2 + THICK + 0.001, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[DEPTH - 0.1, TOTAL_H - 0.2]} />
        <primitive object={pegWallMaterial} attach="material" />
      </mesh>

      {/* ── Outer Right Upright Wall ── */}
      <mesh position={[TOTAL_W / 2 - THICK / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[THICK, TOTAL_H, DEPTH]} />
        <primitive object={oakMaterial} attach="material" />
      </mesh>
      {/* Right Wall Inner Peg-hole Overlay */}
      <mesh
        position={[TOTAL_W / 2 - THICK - 0.001, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[DEPTH - 0.1, TOTAL_H - 0.2]} />
        <primitive object={pegWallMaterial} attach="material" />
      </mesh>

      {/* ── Vertical Dividers (separate the bays) ── */}
      {Array.from({ length: columns - 1 }, (_, index) => index).map((index) => {
        const x = -TOTAL_W / 2 + THICK + BAY_W * (index + 1) + THICK * index + THICK / 2
        const divider = index % 2 === 0 ? 1 : -1
        return (
          <group key={index} position={[x, 0, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[THICK, TOTAL_H, DEPTH]} />
              <primitive object={oakMaterial} attach="material" />
            </mesh>
            <mesh
              position={[-divider * (THICK / 2 + 0.001), 0, 0]}
              rotation={[0, divider * Math.PI / 2, 0]}
            >
              <planeGeometry args={[DEPTH - 0.1, TOTAL_H - 0.2]} />
              <primitive object={pegWallMaterial} attach="material" />
            </mesh>
          </group>
        )
      })}

      {/* ── Shelf Planks (four rows of equal-sized cubbies) ── */}
      {shelfLevels.map((y, index) => (
        <mesh key={index} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[TOTAL_W - 0.04, THICK, DEPTH]} />
          <primitive object={oakMaterial} attach="material" />
        </mesh>
      ))}

      {/* Floor Shadow Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -TOTAL_H / 2 - 0.01, 0]} receiveShadow>
        <planeGeometry args={[TOTAL_W + 1.5, DEPTH + 1.5]} />
        <meshStandardMaterial color="#0e0e16" roughness={1} />
      </mesh>
    </group>
  )
}

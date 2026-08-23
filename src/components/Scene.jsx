import GameBox from './GameBox'
import SonyPVM from './SonyPVM'

const GAMES = [
  {
    id: 'aladdin',
    // Shelf position: x=0, y = shelf_top + half_box_height
    // Shelf plank top at y=-1.65+0.12=−1.53; box center at -1.53+1.0=-0.53
    position: [0, -0.53, 0.1],
    coverUrl: '/textures/aladdin-cover.jpg',
    cartUrl: '/textures/aladdin-cart.png',
    manualUrl: '/manuals/Aladdin_MD_US_manual.pdf',
    manualPreviewUrl: '/manuals/aladdin-manual-page1.png',
  }
]

export default function Scene({
  selectedGame,
  onSelect,
  isOpen,
  isTvOn,
  onToggleTv,
  onPlayCartridge,
}) {
  return (
    <>
      {/* Background color */}
      <color attach="background" args={['#0a0a14']} />
      <fog attach="fog" args={['#0a0a14', 14, 26]} />

      {/* Lighting */}
      <ambientLight intensity={0.55} color="#ffd8a0" />
      <directionalLight
        position={[4, 7, 6]}
        intensity={1.8}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      {/* Subtle fill from the left */}
      <pointLight position={[-5, 3, 4]} intensity={0.6} color="#5080ff" />
      {/* Warm accent from below */}
      <pointLight position={[0, -2, 4]} intensity={0.3} color="#ff6020" />

      {/* Shelf unit */}
      <ShelfUnit />

      {/* 3D Sony PVM-14M4E Retro CRT Monitor (angled to show depth and side vents) */}
      <SonyPVM
        position={[0.18, 2.05, -0.20]}
        rotation={[0.02, -0.28, 0]}
        isOn={isTvOn}
        onTogglePower={onToggleTv}
        screenTextureUrl="/textures/aladdin-title.png"
      />

      {/* Game boxes */}
      {GAMES.map(game => (
        <GameBox
          key={game.id}
          gameId={game.id}
          position={game.position}
          coverUrl={game.coverUrl}
          cartUrl={game.cartUrl}
          manualUrl={game.manualUrl}
          manualPreviewUrl={game.manualPreviewUrl}
          isSelected={selectedGame === game.id}
          onSelect={() => onSelect(game.id)}
          isOpen={selectedGame === game.id && isOpen}
          onPlayCartridge={onPlayCartridge}
        />
      ))}
    </>
  )
}

function ShelfUnit() {
  return (
    <group position={[0, -1.65, -0.25]}>
      {/* Main lower plank (Game Shelf) */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[5.8, 0.22, 1.3]} />
        <meshStandardMaterial color="#5a3418" roughness={0.82} metalness={0.0} />
      </mesh>

      {/* Lower plank front edge highlight */}
      <mesh position={[0, 0.11, 0.65]}>
        <boxGeometry args={[5.8, 0.04, 0.04]} />
        <meshStandardMaterial color="#7a4a28" roughness={0.7} />
      </mesh>

      {/* Upper monitor shelf plank (supports Sony PVM) */}
      <mesh position={[0, 2.37, 0]} receiveShadow castShadow>
        <boxGeometry args={[5.8, 0.18, 1.55]} />
        <meshStandardMaterial color="#5a3418" roughness={0.82} metalness={0.0} />
      </mesh>

      {/* Upper shelf front edge highlight */}
      <mesh position={[0, 2.46, 0.775]}>
        <boxGeometry args={[5.8, 0.04, 0.04]} />
        <meshStandardMaterial color="#7a4a28" roughness={0.7} />
      </mesh>

      {/* Top crown plank */}
      <mesh position={[0, 5.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[5.8, 0.16, 1.55]} />
        <meshStandardMaterial color="#5a3418" roughness={0.82} metalness={0.0} />
      </mesh>

      {/* Back panel / wall */}
      <mesh position={[0, 2.45, -0.61]} receiveShadow>
        <boxGeometry args={[5.8, 5.1, 0.08]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
      </mesh>

      {/* Left side panel */}
      <mesh position={[-2.88, 2.45, 0]} receiveShadow>
        <boxGeometry args={[0.07, 5.1, 1.35]} />
        <meshStandardMaterial color="#4a2c10" roughness={0.85} />
      </mesh>

      {/* Right side panel */}
      <mesh position={[2.88, 2.45, 0]} receiveShadow>
        <boxGeometry args={[0.07, 5.1, 1.35]} />
        <meshStandardMaterial color="#4a2c10" roughness={0.85} />
      </mesh>

      {/* Floor shadow plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0]} receiveShadow>
        <planeGeometry args={[6, 2]} />
        <meshStandardMaterial color="#0a0a14" roughness={1} />
      </mesh>
    </group>
  )
}

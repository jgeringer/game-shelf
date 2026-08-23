import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, PresentationControls } from '@react-three/drei'
import * as THREE from 'three'

// ── Box dimensions (approx Sega Genesis case proportions) ──
const BW = 1.38   // width
const BH = 2.0    // height
const BD = 0.30   // depth

// ── UV splits for the 1231-wide cover image ──
// Real Genesis box: back≈135mm, spine≈20mm, front≈135mm (290mm total)
// Pixel splits: back 0-573, spine 573-657, front 657-1231
const UV_BACK  = { ox: 0.000, rx: 0.465 }
const UV_SPINE = { ox: 0.465, rx: 0.068 }
const UV_FRONT = { ox: 0.533, rx: 0.467 }

// ── Cartridge dimensions using Genesis ratio 118mm x 68mm x 15mm ──
const CART_SCALE = 0.0094
const CW = 118 * CART_SCALE
const CH = 68 * CART_SCALE
const CD = 15 * CART_SCALE

// ─────────────────────────────────────────────
//  Cartridge mesh
// ─────────────────────────────────────────────
function Cartridge({ tex, onClick, onPointerEnter, onPointerLeave }) {
  const bodyGeometry = useMemo(() => {
    const w = CW
    const h = CH
    const hw = w / 2
    const hh = h / 2

    const shape = new THREE.Shape()
    shape.moveTo(-hw * 0.88, -hh * 0.62)
    shape.lineTo(-hw * 0.88, hh * 0.30)
    shape.quadraticCurveTo(-hw * 0.88, hh * 0.52, -hw * 0.66, hh * 0.52)
    shape.lineTo(hw * 0.66, hh * 0.52)
    shape.quadraticCurveTo(hw * 0.88, hh * 0.52, hw * 0.88, hh * 0.30)
    shape.lineTo(hw * 0.88, -hh * 0.62)
    shape.quadraticCurveTo(hw * 0.88, -hh * 0.90, hw * 0.56, -hh * 0.90)
    shape.lineTo(-hw * 0.56, -hh * 0.90)
    shape.quadraticCurveTo(-hw * 0.88, -hh * 0.90, -hw * 0.88, -hh * 0.62)

    return new THREE.ExtrudeGeometry(shape, {
      depth: CD,
      bevelEnabled: false,
      curveSegments: 18,
    })
  }, [])

  return (
    <group
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Main body */}
      <mesh castShadow position={[0, 0, -CD / 2]} geometry={bodyGeometry}>
        <meshStandardMaterial
          color="#111111"
          roughness={0.55}
          metalness={0.12}
        />
      </mesh>

      {/* Rounded top and bottom ribs to match Genesis cart profile */}
      <mesh position={[0, CH * 0.40, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[CD * 0.50, CD * 0.50, CW * 0.92, 20]} />
        <meshStandardMaterial color="#141414" roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, -CH * 0.47, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[CD * 0.66, CD * 0.66, CW * 0.82, 20]} />
        <meshStandardMaterial color="#101010" roughness={0.65} metalness={0.08} />
      </mesh>

      {/* Front label */}
      <mesh position={[0, 0.02, CD / 2 + 0.001]}>
        <planeGeometry args={[CW * 0.92, CH * 0.92]} />
        <meshStandardMaterial
          map={tex}
          transparent
          alphaTest={0.2}
          roughness={0.95}
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Connector notch cut-out (dark recessed area at top) */}
      <mesh position={[0, CH / 2 - CH * 0.20, 0]}>
        <boxGeometry args={[CW * 0.52, CH * 0.20, CD * 0.42]} />
        <meshStandardMaterial color="#080808" roughness={0.9} metalness={0.25} />
      </mesh>

      {/* Front dedicated click target plane */}
      {onClick && (
        <mesh position={[0, 0, CD / 2 + 0.012]} onClick={onClick}>
          <planeGeometry args={[CW * 1.1, CH * 1.1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────
//  Inner box geometry (static faces + lid + cartridge)
// ─────────────────────────────────────────────
function BoxMesh({
  gameId,
  isOpen,
  isSelected,
  onSelect,
  coverUrl,
  cartUrl,
  manualUrl,
  manualPreviewUrl,
  onPlayCartridge,
}) {
  const lidRef  = useRef()
  const cartRef = useRef()
  const manualRef = useRef()
  const animRef = useRef({
    lid: 0,
    cartX: 0,
    cartY: -0.08,
    cartZ: 0,
    cartRotX: 0,
    cartRotZ: -Math.PI / 2,
    cartScale: 1,
    manualY: 0,
    manualZ: 0,
    manualRotX: 0,
    manualScale: 1,
  })
  const [hovered, setHovered] = useState(false)
  const [cartHovered, setCartHovered] = useState(false)
  const [manualHovered, setManualHovered] = useState(false)

  // Load & split textures
  const coverTex = useTexture(coverUrl)
  const cartTex = useTexture(cartUrl, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.ClampToEdgeWrapping
    t.wrapT = THREE.ClampToEdgeWrapping
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
  })
  const manualTex = useTexture(manualPreviewUrl, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.ClampToEdgeWrapping
    t.wrapT = THREE.ClampToEdgeWrapping
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
  })

  const { frontTex, backTex, spineTex } = useMemo(() => {
    const make = ({ ox, rx }) => {
      const t = coverTex.clone()
      t.needsUpdate = true
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
      t.offset.set(ox, 0)
      t.repeat.set(rx, 1)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    }
    return {
      frontTex: make(UV_FRONT),
      backTex:  make(UV_BACK),
      spineTex: make(UV_SPINE),
    }
  }, [coverTex])

  const handleManualClick = (e) => {
    e.stopPropagation()
    window.open(manualUrl, '_blank', 'noopener,noreferrer')
  }

  useFrame((_, delta) => {
    const dt  = Math.min(delta, 0.05)
    const a   = animRef.current

    // Lid swing (hinge on left edge of front face, negative Y = opens outward)
    if (lidRef.current) {
      const targetLid = isOpen ? -Math.PI * 0.98 : 0
      a.lid += (targetLid - a.lid) * dt * 4.5
      lidRef.current.rotation.y = a.lid
    }

    // Cartridge slide-out animation on hover when open
    if (cartRef.current) {
      const isHovering = isOpen && cartHovered
      const targetX = 0
      const targetY = isHovering ? -0.03 : -0.08
      const targetZ = isHovering ? 0.32 : 0.0
      const targetRotX = isHovering ? 0.08 : 0.0
      const targetRotZ = -Math.PI / 2
      const targetScale = isHovering ? 1.04 : 1.0

      a.cartX += (targetX - a.cartX) * dt * 9
      a.cartY += (targetY - a.cartY) * dt * 9
      a.cartZ += (targetZ - a.cartZ) * dt * 9
      a.cartRotX += (targetRotX - a.cartRotX) * dt * 9
      a.cartRotZ += (targetRotZ - a.cartRotZ) * dt * 9
      a.cartScale += (targetScale - a.cartScale) * dt * 9

      cartRef.current.position.set(a.cartX, a.cartY, a.cartZ)
      cartRef.current.rotation.set(a.cartRotX, 0, a.cartRotZ)
      cartRef.current.scale.setScalar(a.cartScale)
    }

    // Manual slide-out animation on hover when open
    if (manualRef.current) {
      const isManHover = isOpen && manualHovered
      const targetMY = isManHover ? 0.03 : 0.0
      const targetMZ = isManHover ? 0.22 : 0.0
      const targetMRotX = isManHover ? 0.05 : 0.0
      const targetMScale = isManHover ? 1.04 : 1.0

      a.manualY += (targetMY - a.manualY) * dt * 9
      a.manualZ += (targetMZ - a.manualZ) * dt * 9
      a.manualRotX += (targetMRotX - a.manualRotX) * dt * 9
      a.manualScale += (targetMScale - a.manualScale) * dt * 9

      manualRef.current.position.set(0, a.manualY, a.manualZ)
      manualRef.current.rotation.set(a.manualRotX, 0, 0)
      manualRef.current.scale.setScalar(a.manualScale)
    }
  })

  const handleClick = !isSelected
    ? (e) => { e.stopPropagation(); onSelect() }
    : undefined

  const darkEdge = <meshStandardMaterial color="#0c0c0c" roughness={0.75} />
  const interior = <meshStandardMaterial color="#1a1a1a" roughness={0.95} />

  return (
    <group
      onClick={handleClick}
      onPointerEnter={() => {
        if (!isSelected) { setHovered(true); document.body.style.cursor = 'pointer' }
      }}
      onPointerLeave={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* ── Static outer faces ── */}

      {/* Back face */}
      <mesh position={[0, 0, -BD / 2]} rotation={[0, Math.PI, 0]} castShadow>
        <planeGeometry args={[BW, BH]} />
        <meshStandardMaterial map={backTex} />
      </mesh>

      {/* Spine (left outer edge) */}
      <mesh position={[-BW / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <planeGeometry args={[BD, BH]} />
        <meshStandardMaterial map={spineTex} />
      </mesh>

      {/* Right outer edge */}
      <mesh position={[BW / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <planeGeometry args={[BD, BH]} />
        {darkEdge}
      </mesh>

      {/* Top edge */}
      <mesh position={[0, BH / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[BW, BD]} />
        {darkEdge}
      </mesh>

      {/* Bottom edge */}
      <mesh position={[0, -BH / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BW, BD]} />
        {darkEdge}
      </mesh>

      {/* ── Interior walls (visible when open) ── */}

      <mesh position={[0, 0, -BD / 2 + 0.011]}>
        <planeGeometry args={[BW - 0.018, BH - 0.018]} />
        {interior}
      </mesh>
      <mesh position={[-BW / 2 + 0.011, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[BD - 0.018, BH - 0.018]} />
        {interior}
      </mesh>
      <mesh position={[BW / 2 - 0.011, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[BD - 0.018, BH - 0.018]} />
        {interior}
      </mesh>
      <mesh position={[0, BH / 2 - 0.011, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BW - 0.018, BD - 0.018]} />
        {interior}
      </mesh>
      <mesh position={[0, -BH / 2 + 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BW - 0.018, BD - 0.018]} />
        {interior}
      </mesh>

      {/* ── Cartridge sitting inside ── */}
      <group ref={cartRef} position={[0, -0.08, 0]}>
        <Cartridge
          tex={cartTex}
          isHovered={cartHovered}
          onClick={isOpen ? (e) => {
            e.stopPropagation()
            onPlayCartridge?.(gameId || 'aladdin')
          } : undefined}
          onPointerEnter={isOpen ? (e) => {
            e.stopPropagation()
            setCartHovered(true)
            document.body.style.cursor = 'pointer'
          } : undefined}
          onPointerLeave={isOpen ? (e) => {
            e.stopPropagation()
            setCartHovered(false)
            document.body.style.cursor = hovered ? 'pointer' : 'auto'
          } : undefined}
        />
      </group>

      {/* Cartridge retaining clips (right panel) */}
      {isOpen && (
        <>
          <mesh position={[0.04, 0.52, 0.073]}>
            <boxGeometry args={[0.05, 0.075, 0.026]} />
            <meshStandardMaterial color="#121212" roughness={0.88} />
          </mesh>
          <mesh position={[0.58, 0.52, 0.073]}>
            <boxGeometry args={[0.05, 0.075, 0.026]} />
            <meshStandardMaterial color="#121212" roughness={0.88} />
          </mesh>
          <mesh position={[0.04, -0.63, 0.073]}>
            <boxGeometry args={[0.05, 0.075, 0.026]} />
            <meshStandardMaterial color="#121212" roughness={0.88} />
          </mesh>
          <mesh position={[0.58, -0.63, 0.073]}>
            <boxGeometry args={[0.05, 0.075, 0.026]} />
            <meshStandardMaterial color="#121212" roughness={0.88} />
          </mesh>

          <mesh position={[0.31, 0.64, 0.055]}>
            <boxGeometry args={[0.09, 0.08, 0.04]} />
            <meshStandardMaterial color="#141414" roughness={0.9} />
          </mesh>
          <mesh position={[0.31, -0.74, 0.055]}>
            <boxGeometry args={[0.09, 0.08, 0.04]} />
            <meshStandardMaterial color="#141414" roughness={0.9} />
          </mesh>

        </>
      )}

      {/* Display hang tab (always visible) */}
      <group position={[0, BH / 2 + 0.11, -0.02]}>
        <mesh>
          <boxGeometry args={[0.28, 0.16, 0.03]} />
          <meshStandardMaterial color="#4a4133" roughness={0.86} metalness={0.02} />
        </mesh>
        {/* Neck where the tab joins the case */}
        <mesh position={[0, -0.09, 0]}>
          <boxGeometry args={[0.10, 0.03, 0.03]} />
          <meshStandardMaterial color="#222222" roughness={0.85} />
        </mesh>
        {/* Slot cutout (simulated with dark insets) */}
        <mesh position={[0, 0.005, 0.016]}>
          <boxGeometry args={[0.11, 0.035, 0.003]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <mesh position={[-0.06, 0.005, 0.016]}>
          <circleGeometry args={[0.018, 20]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <mesh position={[0.06, 0.005, 0.016]}>
          <circleGeometry args={[0.018, 20]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
      </group>

      {/* ── Front face (animated hinge lid) ── */}
      {/*   Pivot point: left edge of the front face at (-BW/2, 0, BD/2)  */}
      <group position={[-BW / 2, 0, BD / 2]}>
        <group ref={lidRef}>
          {/* Face mesh: offset +BW/2 so its centre lines up with box front */}
          <mesh position={[BW / 2, 0, 0]} castShadow>
            <planeGeometry args={[BW, BH]} />
            <meshStandardMaterial map={frontTex} side={THREE.DoubleSide} />
          </mesh>
          {/* Inside of cover (dark card interior) */}
          <mesh position={[BW / 2, 0, -0.002]}>
            <planeGeometry args={[BW - 0.008, BH - 0.008]} />
            <meshStandardMaterial color="#0e0e0e" roughness={0.95} side={THREE.BackSide} />
          </mesh>

          {isOpen && (
            <group
              position={[BW / 2 - 0.17, -0.01, 0.012]}
              rotation={[0, Math.PI, 0]}
              onPointerEnter={() => {
                setManualHovered(true)
                document.body.style.cursor = 'pointer'
              }}
              onPointerLeave={() => {
                setManualHovered(false)
                document.body.style.cursor = hovered ? 'pointer' : 'auto'
              }}
            >
              {/* Animated Manual Booklet */}
              <group ref={manualRef}>
                {/* Manual cover image from page 1 of the PDF. */}
                <mesh position={[0, 0, 0.022]} renderOrder={10} onClick={handleManualClick}>
                  <planeGeometry args={[0.88, 1.66]} />
                  <meshBasicMaterial
                    map={manualTex}
                    toneMapped={false}
                    side={THREE.FrontSide}
                  />
                </mesh>

                {/* Larger click target to make opening the PDF easier. */}
                <mesh position={[0, 0, 0.024]} onClick={handleManualClick}>
                  <planeGeometry args={[0.96, 1.78]} />
                  <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
                </mesh>
              </group>

              {/* Manual retaining clips (remain fixed on inside lid) */}
              <mesh position={[-0.42, 0.66, 0.014]}>
                <boxGeometry args={[0.07, 0.05, 0.03]} />
                <meshStandardMaterial color="#141414" roughness={0.9} />
              </mesh>
              <mesh position={[0.42, 0.66, 0.014]}>
                <boxGeometry args={[0.07, 0.05, 0.03]} />
                <meshStandardMaterial color="#141414" roughness={0.9} />
              </mesh>
              <mesh position={[-0.42, -0.66, 0.014]}>
                <boxGeometry args={[0.07, 0.05, 0.03]} />
                <meshStandardMaterial color="#141414" roughness={0.9} />
              </mesh>
              <mesh position={[0.42, -0.66, 0.014]}>
                <boxGeometry args={[0.07, 0.05, 0.03]} />
                <meshStandardMaterial color="#141414" roughness={0.9} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* ── Hover glow ── */}
      {hovered && !isSelected && (
        <mesh position={[0, 0, BD / 2 + 0.003]}>
          <planeGeometry args={[BW + 0.08, BH + 0.08]} />
          <meshBasicMaterial
            color="#ffe080"
            transparent
            opacity={0.09}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────
//  GameBox  – wraps BoxMesh with position
//  animation and PresentationControls
// ─────────────────────────────────────────────
export default function GameBox({
  gameId,
  position,
  isSelected,
  onSelect,
  isOpen,
  coverUrl,
  cartUrl,
  manualUrl,
  manualPreviewUrl,
  onPlayCartridge,
}) {
  const outerRef  = useRef()
  const [controlsKey, setControlsKey] = useState(0)
  const poseRef = useRef()
  const prevOpenRef = useRef(isOpen)
  const prevSelectedRef = useRef(isSelected)
  const preOpenQuatRef = useRef(new THREE.Quaternion())
  const shouldRestoreRef = useRef(false)
  const shouldResetForShelfRef = useRef(false)
  const shelfQuatRef = useRef(new THREE.Quaternion())
  const animState = useRef({
    pos:   new THREE.Vector3(...position),
    scale: 1,
  })
  const hovRef = useRef(false)

  useEffect(() => {
    const wasOpen = prevOpenRef.current
    if (!wasOpen && isOpen && poseRef.current) {
      preOpenQuatRef.current.copy(poseRef.current.quaternion)
      shouldRestoreRef.current = false
    }
    if (wasOpen && !isOpen) {
      shouldRestoreRef.current = true
    }
    prevOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    const wasSelected = prevSelectedRef.current
    if (wasSelected && !isSelected) {
      shouldResetForShelfRef.current = true
      shouldRestoreRef.current = false
      setControlsKey(k => k + 1)
    }
    prevSelectedRef.current = isSelected
  }, [isSelected])

  useFrame((_, delta) => {
    if (!outerRef.current) return
    const dt = Math.min(delta, 0.05)
    const a  = animState.current

    // Fly-out / return position
    const tx = isSelected ? 0    : position[0]
    const ty = isSelected ? 0.3  : position[1]
    const tz = isSelected ? 5.2  : position[2]
    a.pos.x += (tx - a.pos.x) * dt * 5
    a.pos.y += (ty - a.pos.y) * dt * 5
    a.pos.z += (tz - a.pos.z) * dt * 5
    outerRef.current.position.copy(a.pos)

    // Hover scale
    const targetScale = (hovRef.current && !isSelected) ? 1.05 : 1.0
    a.scale += (targetScale - a.scale) * dt * 9
    outerRef.current.scale.setScalar(a.scale)

    if (poseRef.current && shouldRestoreRef.current) {
      poseRef.current.quaternion.slerp(preOpenQuatRef.current, dt * 7)
      if (poseRef.current.quaternion.angleTo(preOpenQuatRef.current) < 0.01) {
        poseRef.current.quaternion.copy(preOpenQuatRef.current)
        shouldRestoreRef.current = false
      }
    }

    if (poseRef.current && shouldResetForShelfRef.current) {
      poseRef.current.quaternion.slerp(shelfQuatRef.current, dt * 8)
      if (poseRef.current.quaternion.angleTo(shelfQuatRef.current) < 0.01) {
        poseRef.current.quaternion.copy(shelfQuatRef.current)
        shouldResetForShelfRef.current = false
      }
    }
  })

  return (
    <group
      ref={outerRef}
      position={position}
      onPointerEnter={() => { hovRef.current = true }}
      onPointerLeave={() => { hovRef.current = false }}
    >
      <PresentationControls
        key={controlsKey}
        enabled={isSelected}
        snap={false}
        polar={[-Math.PI / 3, Math.PI / 3]}
        azimuth={[-Math.PI / 1.3, Math.PI / 1.3]}
        config={{ mass: 2, tension: 290, friction: 48 }}
        speed={1.4}
      >
        <group ref={poseRef}>
          <BoxMesh
            gameId={gameId}
            isOpen={isOpen}
            isSelected={isSelected}
            onSelect={onSelect}
            coverUrl={coverUrl}
            cartUrl={cartUrl}
            manualUrl={manualUrl}
            manualPreviewUrl={manualPreviewUrl}
            onPlayCartridge={onPlayCartridge}
          />
        </group>
      </PresentationControls>
    </group>
  )
}

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// ── Dimensions of Sony PVM-14M4E ──
const TV_W = 2.50       // Total width
const TV_H = 2.40       // Total height
const TV_D = 2.65       // Total depth
const BEZEL_D = 0.30    // Front bezel depth

const SCREEN_W = 1.84   // Screen aperture width
const SCREEN_H = 1.38   // Screen aperture height (4:3 ratio)
const SCREEN_CY = 0.22  // Screen center Y

// ─────────────────────────────────────────────────────────
// Procedural Canvas Textures for crisp retro graphics
// ─────────────────────────────────────────────────────────

function createHRTrinitronTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, 512, 128)
  ctx.fillStyle = 'rgba(235, 235, 240, 0.95)'
  ctx.font = 'bold 56px Arial, sans-serif'
  ctx.fillText('HR', 12, 82)

  ctx.font = '32px Arial, sans-serif'
  ctx.fillStyle = 'rgba(215, 215, 220, 0.88)'
  ctx.fillText('Trinitron', 104, 82)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function createSonyLogoTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, 512, 128)
  ctx.fillStyle = '#eaeaf0'
  ctx.font = 'bold 64px "Times New Roman", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.letterSpacing = '6px'
  ctx.fillText('SONY', 256, 86)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function createSpeakerGrilleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#1e2024'
  ctx.fillRect(0, 0, 512, 256)

  // Model text
  ctx.fillStyle = 'rgba(200, 205, 210, 0.92)'
  ctx.font = 'bold 24px "Courier New", monospace'
  ctx.fillText('PVM-14M4E', 24, 36)

  // Perforated speaker grill pattern
  ctx.fillStyle = '#0e0f11'
  const startY = 58
  const endY = 236
  const startX = 20
  const endX = 492
  const dotR = 2.5
  const gap = 8

  for (let y = startY; y < endY; y += gap) {
    const shift = ((y - startY) / gap) % 2 === 0 ? 0 : gap / 2
    for (let x = startX + shift; x < endX; x += gap) {
      ctx.beginPath()
      ctx.arc(x, y, dotR, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function createSideVentsTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Beige chassis background
  ctx.fillStyle = '#9e9d99'
  ctx.fillRect(0, 0, 512, 512)

  // Vent grill slot generator
  const drawVentRow = (startX, startY, width, height, count, gapY) => {
    for (let i = 0; i < count; i++) {
      const y = startY + i * (height + gapY)
      ctx.fillStyle = '#383836'
      ctx.fillRect(startX, y, width, height)
      ctx.fillStyle = '#b5b4af'
      ctx.fillRect(startX, y + height, width, 1.5)
    }
  }

  // Top vent clusters
  drawVentRow(30, 45, 190, 4, 18, 5)
  drawVentRow(240, 45, 190, 4, 18, 5)

  // Bottom vent clusters
  drawVentRow(30, 270, 190, 4, 14, 5)
  drawVentRow(240, 270, 190, 4, 14, 5)

  // Screws
  const drawScrew = (cx, cy) => {
    ctx.fillStyle = '#6e6d68'
    ctx.beginPath()
    ctx.arc(cx, cy, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#c5c4be'
    ctx.beginPath()
    ctx.arc(cx, cy, 7, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#4e4d48'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(cx - 5, cy)
    ctx.lineTo(cx + 5, cy)
    ctx.moveTo(cx, cy - 5)
    ctx.lineTo(cx, cy + 5)
    ctx.stroke()
  }

  drawScrew(470, 70)
  drawScrew(470, 440)
  drawScrew(70, 440)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function createControlPanelTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#26282c'
  ctx.fillRect(0, 0, 1024, 256)

  // Button labels
  ctx.fillStyle = '#b0b2b8'
  ctx.font = 'bold 16px Arial, sans-serif'

  const labels1 = [
    { text: 'RGB/COMP', x: 50 },
    { text: 'LINE A', x: 145 },
    { text: 'LINE B', x: 235 },
    { text: 'EXT SYNC', x: 325 },
    { text: 'MENU', x: 440 },
  ]
  labels1.forEach(l => ctx.fillText(l.text, l.x, 36))

  const labels2 = [
    { text: 'DEGAUSS', x: 45 },
    { text: 'BLUE ONLY', x: 135 },
    { text: 'UNDERSCAN', x: 220 },
    { text: '16:9', x: 340 },
    { text: 'ENTER', x: 435 },
  ]
  labels2.forEach(l => ctx.fillText(l.text, l.x, 150))

  // Knob labels
  ctx.font = '14px Arial, sans-serif'
  const knobLabels = [
    { text: 'APERTURE', x: 530 },
    { text: 'BRIGHT', x: 615 },
    { text: 'CHROMA', x: 700 },
    { text: 'PHASE', x: 785 },
    { text: 'CONTRAST', x: 865 },
    { text: 'VOLUME', x: 945 },
  ]
  knobLabels.forEach(k => {
    ctx.fillText(k.text, k.x, 36)
    ctx.strokeStyle = '#5c5e64'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(k.x + 30, 95, 24, Math.PI * 0.75, Math.PI * 2.25)
    ctx.stroke()
  })

  // Power label
  ctx.fillStyle = '#d0d2d8'
  ctx.font = 'bold 15px Arial, sans-serif'
  ctx.fillText('POWER', 950, 160)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function createScanlinesTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 16, 512)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
  for (let y = 0; y < 512; y += 4) {
    ctx.fillRect(0, y, 16, 2)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 1)
  tex.needsUpdate = true
  return tex
}

// ─────────────────────────────────────────────────────────
// Curved Trinitron Screen Geometry (Cylindrical curved face)
// ─────────────────────────────────────────────────────────

function createCylindricalScreenGeometry(width, height, radius = 5.2, segmentsX = 32, segmentsY = 16) {
  const geom = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY)
  const pos = geom.attributes.position

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const zOffset = radius - Math.sqrt(Math.max(0, radius * radius - x * x))
    const y = pos.getY(i)
    const yOffset = (y * y) / (radius * 12)
    pos.setZ(i, -zOffset - yOffset)
  }

  geom.computeVertexNormals()
  return geom
}

// ─────────────────────────────────────────────────────────
// Sony PVM-14M4E 3D Component
// ─────────────────────────────────────────────────────────

export default function SonyPVM({
  position = [0.18, 2.05, -0.20],
  rotation = [0.02, -0.28, 0],
  scale = 1,
  isOn = false,
  onTogglePower,
  screenTextureUrl = '/textures/aladdin-title.png',
}) {
  const groupRef = useRef()
  const flashMeshRef = useRef()
  const powerAnimRef = useRef(isOn ? 1 : 0)
  const [hoveredPower, setHoveredPower] = useState(false)
  const [hoveredScreen, setHoveredScreen] = useState(false)

  // Load screen texture
  const titleTex = useTexture(screenTextureUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
  })

  // Canvas textures for logos, labels, vents, scanlines
  const hrTrinitronTex = useMemo(() => createHRTrinitronTexture(), [])
  const sonyLogoTex = useMemo(() => createSonyLogoTexture(), [])
  const speakerGrilleTex = useMemo(() => createSpeakerGrilleTexture(), [])
  const sideVentsTex = useMemo(() => createSideVentsTexture(), [])
  const controlPanelTex = useMemo(() => createControlPanelTexture(), [])
  const scanlinesTex = useMemo(() => createScanlinesTexture(), [])

  // Curved CRT Geometry
  const screenGeom = useMemo(() => createCylindricalScreenGeometry(SCREEN_W, SCREEN_H), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)

    // Smooth power animation
    const targetPower = isOn ? 1.0 : 0.0
    powerAnimRef.current += (targetPower - powerAnimRef.current) * dt * 9.0

    // Animate CRT startup flash
    if (flashMeshRef.current) {
      if (isOn && powerAnimRef.current < 0.85) {
        flashMeshRef.current.visible = true
        flashMeshRef.current.scale.set(1.0, Math.max(0.01, (1.0 - powerAnimRef.current) * 0.15), 1.0)
        flashMeshRef.current.material.opacity = (1.0 - powerAnimRef.current) * 0.95
      } else {
        flashMeshRef.current.visible = false
      }
    }
  })

  // Materials
  const chassisMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9e9d99',
    roughness: 0.65,
    metalness: 0.18,
  }), [])

  const darkBezelMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#26282d',
    roughness: 0.72,
    metalness: 0.12,
  }), [])

  const innerHoodMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#18191c',
    roughness: 0.90,
    metalness: 0.08,
  }), [])

  const handleMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#141416',
    roughness: 0.45,
    metalness: 0.55,
  }), [])

  const knobMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#202226',
    roughness: 0.5,
    metalness: 0.35,
  }), [])

  const buttonMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c4c6cb',
    roughness: 0.6,
    metalness: 0.1,
  }), [])

  const chromeLogoMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: sonyLogoTex,
    transparent: true,
    roughness: 0.25,
    metalness: 0.85,
  }), [sonyLogoTex])

  const tallyLampMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f0f0ea',
    roughness: 0.3,
    metalness: 0.1,
    emissive: isOn ? '#ffffff' : '#000000',
    emissiveIntensity: isOn ? 0.3 : 0.0,
  }), [isOn])

  // Coordinate Calculations
  const bodyZ = -BEZEL_D / 2
  const bezelZ = (TV_D - BEZEL_D) / 2
  const bezelFrontZ = bezelZ + BEZEL_D / 2

  // Frame heights and widths around the 1.84 x 1.38 window centered at [0, SCREEN_CY]:
  const topBarH = TV_H / 2 - (SCREEN_CY + SCREEN_H / 2) // 1.20 - 0.91 = 0.29
  const topBarY = SCREEN_CY + SCREEN_H / 2 + topBarH / 2 // 0.91 + 0.145 = 1.055

  const bottomBarH = SCREEN_CY - SCREEN_H / 2 - (-TV_H / 2) // -0.47 - (-1.20) = 0.73
  const bottomBarY = -TV_H / 2 + bottomBarH / 2 // -1.20 + 0.365 = -0.835

  const sideColW = (TV_W - SCREEN_W) / 2 // (2.50 - 1.84) / 2 = 0.33
  const leftColX = -TV_W / 2 + sideColW / 2 // -1.25 + 0.165 = -1.085
  const rightColX = TV_W / 2 - sideColW / 2 // 1.25 - 0.165 = 1.085

  const screenZ = bezelFrontZ - 0.12

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* ── Outer Metal Chassis (Beige / Warm Grey) ── */}
      <mesh position={[0, 0, bodyZ]} castShadow receiveShadow>
        <boxGeometry args={[TV_W, TV_H, TV_D - BEZEL_D]} />
        <primitive object={chassisMat} attach="material" />
      </mesh>

      {/* Side Vent Panels (Left & Right) with slot texture */}
      <mesh position={[-TV_W / 2 - 0.001, 0, bodyZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[TV_D - BEZEL_D - 0.1, TV_H - 0.15]} />
        <meshStandardMaterial map={sideVentsTex} roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh position={[TV_W / 2 + 0.001, 0, bodyZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[TV_D - BEZEL_D - 0.1, TV_H - 0.15]} />
        <meshStandardMaterial map={sideVentsTex} roughness={0.7} metalness={0.15} />
      </mesh>

      {/* Rubber feet underneath */}
      <mesh position={[-TV_W * 0.38, -TV_H / 2 - 0.04, bodyZ - (TV_D - BEZEL_D) * 0.35]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.08, 16]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      <mesh position={[TV_W * 0.38, -TV_H / 2 - 0.04, bodyZ - (TV_D - BEZEL_D) * 0.35]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.08, 16]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      <mesh position={[-TV_W * 0.38, -TV_H / 2 - 0.04, bodyZ + (TV_D - BEZEL_D) * 0.35]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.08, 16]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      <mesh position={[TV_W * 0.38, -TV_H / 2 - 0.04, bodyZ + (TV_D - BEZEL_D) * 0.35]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.08, 16]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>

      {/* ── 4-Piece Open Bezel Frame (Leaves window completely open for screen) ── */}

      {/* 1. Top Bezel Bar */}
      <mesh position={[0, topBarY, bezelZ]} castShadow receiveShadow>
        <boxGeometry args={[TV_W + 0.02, topBarH, BEZEL_D]} />
        <primitive object={darkBezelMat} attach="material" />
      </mesh>

      {/* HR Trinitron logo on top left of header */}
      <mesh position={[-0.78, topBarY, bezelFrontZ + 0.002]}>
        <planeGeometry args={[0.62, 0.15]} />
        <meshBasicMaterial map={hrTrinitronTex} transparent depthWrite={false} />
      </mesh>

      {/* Tally Light Window at top center of header */}
      <group position={[0, topBarY, bezelFrontZ + 0.002]}>
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[0.26, 0.11]} />
          <meshStandardMaterial color="#151618" />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[0.22, 0.08]} />
          <primitive object={tallyLampMat} attach="material" />
        </mesh>
      </group>

      {/* 2. Left Bezel Side Column */}
      <mesh position={[leftColX, SCREEN_CY, bezelZ]} castShadow receiveShadow>
        <boxGeometry args={[sideColW + 0.02, SCREEN_H + 0.02, BEZEL_D]} />
        <primitive object={darkBezelMat} attach="material" />
      </mesh>

      {/* 3. Right Bezel Side Column */}
      <mesh position={[rightColX, SCREEN_CY, bezelZ]} castShadow receiveShadow>
        <boxGeometry args={[sideColW + 0.02, SCREEN_H + 0.02, BEZEL_D]} />
        <primitive object={darkBezelMat} attach="material" />
      </mesh>

      {/* 4. Bottom Control Deck Slab */}
      <mesh position={[0, bottomBarY, bezelZ]} castShadow receiveShadow>
        <boxGeometry args={[TV_W + 0.02, bottomBarH, BEZEL_D]} />
        <primitive object={darkBezelMat} attach="material" />
      </mesh>

      {/* SONY Metallic Logo centered above control deck */}
      <mesh position={[0, bottomBarY + bottomBarH / 2 - 0.09, bezelFrontZ + 0.002]}>
        <planeGeometry args={[0.48, 0.12]} />
        <primitive object={chromeLogoMat} attach="material" />
      </mesh>

      {/* ── Lower Control Deck Details (Buttons, Knobs, Handles, Speaker) ── */}
      <group position={[0, bottomBarY - 0.07, bezelFrontZ + 0.002]}>
        {/* Left Speaker Grille */}
        <mesh position={[-0.76, 0, 0.002]}>
          <planeGeometry args={[0.76, 0.40]} />
          <meshStandardMaterial map={speakerGrilleTex} roughness={0.85} />
        </mesh>

        {/* Control Panel Section (Buttons, Knobs, Labels) */}
        <mesh position={[0.42, 0, 0.002]}>
          <planeGeometry args={[1.52, 0.40]} />
          <meshStandardMaterial map={controlPanelTex} roughness={0.75} />
        </mesh>

        {/* 3D Push Buttons (Row 1) */}
        {[-0.26, -0.12, 0.02, 0.16, 0.32].map((bx, idx) => (
          <group key={`btn1-${idx}`} position={[bx, 0.08, 0.012]}>
            <mesh castShadow>
              <boxGeometry args={[0.085, 0.065, 0.025]} />
              <primitive object={buttonMat} attach="material" />
            </mesh>
            {/* LED indicator above button */}
            <mesh position={[0, 0.055, 0.005]}>
              <circleGeometry args={[0.012, 12]} />
              <meshStandardMaterial
                color={isOn && idx === 0 ? '#44ff44' : '#223322'}
                emissive={isOn && idx === 0 ? '#44ff44' : '#000000'}
                emissiveIntensity={isOn && idx === 0 ? 0.9 : 0}
              />
            </mesh>
          </group>
        ))}

        {/* 3D Push Buttons (Row 2) */}
        {[-0.26, -0.12, 0.02, 0.16, 0.32].map((bx, idx) => (
          <mesh key={`btn2-${idx}`} position={[bx, -0.09, 0.012]} castShadow>
            <boxGeometry args={[0.085, 0.065, 0.025]} />
            <primitive object={buttonMat} attach="material" />
          </mesh>
        ))}

        {/* 3D Control Knobs (6 Rotary Knobs) */}
        {[0.48, 0.59, 0.70, 0.81, 0.92, 1.03].map((kx, idx) => (
          <group key={`knob-${idx}`} position={[kx, 0, 0.025]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.040, 0.044, 0.038, 20]} />
              <primitive object={knobMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.022, 0.02]}>
              <boxGeometry args={[0.008, 0.025, 0.004]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}

        {/* Power Button & LED Indicator */}
        <group
          position={[1.13, -0.07, 0.015]}
          onClick={(e) => {
            e.stopPropagation()
            onTogglePower?.()
          }}
          onPointerEnter={(e) => {
            e.stopPropagation()
            setHoveredPower(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerLeave={(e) => {
            e.stopPropagation()
            setHoveredPower(false)
            document.body.style.cursor = 'auto'
          }}
        >
          {/* Power button cap */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.09, 0.08, 0.032]} />
            <meshStandardMaterial
              color={hoveredPower ? '#ffffff' : '#d5d7dc'}
              roughness={0.5}
            />
          </mesh>

          {/* Power LED */}
          <mesh position={[0, 0.075, 0.002]}>
            <circleGeometry args={[0.016, 16]} />
            <meshStandardMaterial
              color={isOn ? '#22ff33' : '#881111'}
              emissive={isOn ? '#22ff33' : '#330000'}
              emissiveIntensity={isOn ? 1.2 : 0.1}
            />
          </mesh>
        </group>

        {/* ── Black Metal Rack Handles (Left & Right) ── */}
        {/* Left Handle */}
        <group position={[-1.15, 0, 0.06]}>
          <mesh position={[0, 0.15, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.15, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <cylinderGeometry args={[0.024, 0.024, 0.36, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.17, -0.01]} rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.05, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.17, -0.01]} rotation={[-Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.05, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
        </group>

        {/* Right Handle */}
        <group position={[1.21, 0, 0.06]}>
          <mesh position={[0, 0.15, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.15, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <cylinderGeometry args={[0.024, 0.024, 0.36, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.17, -0.01]} rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.05, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.17, -0.01]} rotation={[-Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.05, 16]} />
            <primitive object={handleMat} attach="material" />
          </mesh>
        </group>
      </group>

      {/* ── Deep Recessed Inner Screen Bezel / Hood Framing CRT ── */}
      <group position={[0, SCREEN_CY, 0]}>
        {/* Top sloping hood wall */}
        <mesh
          position={[0, SCREEN_H / 2 + 0.06, bezelFrontZ - 0.06]}
          rotation={[Math.PI / 5, 0, 0]}
        >
          <planeGeometry args={[SCREEN_W + 0.20, 0.16]} />
          <primitive object={innerHoodMat} attach="material" />
        </mesh>

        {/* Bottom sloping hood wall */}
        <mesh
          position={[0, -SCREEN_H / 2 - 0.06, bezelFrontZ - 0.06]}
          rotation={[-Math.PI / 5, 0, 0]}
        >
          <planeGeometry args={[SCREEN_W + 0.20, 0.16]} />
          <primitive object={innerHoodMat} attach="material" />
        </mesh>

        {/* Left sloping hood wall */}
        <mesh
          position={[-SCREEN_W / 2 - 0.06, 0, bezelFrontZ - 0.06]}
          rotation={[0, -Math.PI / 5, 0]}
        >
          <planeGeometry args={[0.16, SCREEN_H + 0.10]} />
          <primitive object={innerHoodMat} attach="material" />
        </mesh>

        {/* Right sloping hood wall */}
        <mesh
          position={[SCREEN_W / 2 + 0.06, 0, bezelFrontZ - 0.06]}
          rotation={[0, Math.PI / 5, 0]}
        >
          <planeGeometry args={[0.16, SCREEN_H + 0.10]} />
          <primitive object={innerHoodMat} attach="material" />
        </mesh>

        {/* ── CRT Screen Faceplate ── */}
        <mesh
          geometry={screenGeom}
          position={[0, 0, screenZ]}
          onClick={(e) => {
            e.stopPropagation()
            onTogglePower?.()
          }}
          onPointerEnter={(e) => {
            e.stopPropagation()
            setHoveredScreen(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerLeave={(e) => {
            e.stopPropagation()
            setHoveredScreen(false)
            document.body.style.cursor = 'auto'
          }}
        >
          {isOn ? (
            <meshBasicMaterial
              map={titleTex}
              toneMapped={false}
              side={THREE.FrontSide}
            />
          ) : (
            <meshStandardMaterial
              color="#0d0f14"
              roughness={0.25}
              metalness={0.15}
              side={THREE.FrontSide}
            />
          )}
        </mesh>

        {/* CRT Scanline and Phosphor Overlay (visible when ON) */}
        {isOn && (
          <mesh position={[0, 0, screenZ + 0.003]} raycast={() => null}>
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial
              map={scanlinesTex}
              transparent
              opacity={0.30}
              blending={THREE.MultiplyBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Screen Glass Specular Highlight Overlay */}
        <mesh position={[0, 0, screenZ + 0.005]} raycast={() => null}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={isOn ? 0.03 : 0.07}
            depthWrite={false}
          />
        </mesh>

        {/* CRT Power-On Flash Line */}
        <mesh
          ref={flashMeshRef}
          position={[0, 0, screenZ + 0.008]}
          raycast={() => null}
          visible={false}
        >
          <planeGeometry args={[SCREEN_W, 0.4]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>

        {/* Screen hover highlight indicator */}
        {hoveredScreen && (
          <mesh position={[0, 0, screenZ + 0.01]} raycast={() => null}>
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial
              color="#88bbff"
              transparent
              opacity={0.08}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* ── Dynamic CRT Screen Glow Light (casts Aladdin purple/blue hue into room) ── */}
      {isOn && (
        <pointLight
          position={[0, SCREEN_CY, bezelFrontZ + 0.4]}
          intensity={1.2}
          distance={7.0}
          color="#5570ff"
        />
      )}
    </group>
  )
}

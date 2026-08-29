import { useMemo } from 'react'
import { Clone, Center, useGLTF } from '@react-three/drei'

const MODEL_URL = '/models/sega_genesis_model_2__sega_mega_drive/scene.gltf'

export default function SegaGenesisModel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  raw = false,
  modelScale = 0.01,
}) {
  const { scene } = useGLTF(MODEL_URL)

  const model = useMemo(() => {
    const cloned = scene.clone(true)
    cloned.updateMatrixWorld(true)

    cloned.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false
    })

    return cloned
  }, [scene])

  if (raw) {
    return <primitive object={model} scale={modelScale} />
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Center>
        <Clone object={model} scale={modelScale} />
      </Center>
    </group>
  )
}

useGLTF.preload(MODEL_URL)

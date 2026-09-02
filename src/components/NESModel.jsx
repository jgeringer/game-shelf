import { useEffect, useState } from 'react'
import { Center } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

const OBJ_URL = '/models/NES/nes.obj'
const MTL_URL = '/models/NES/obj.mtl'

export default function NESModel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  modelScale = 0.01,
}) {
  const [model, setModel] = useState(null)

  useEffect(() => {
    const mtlLoader = new MTLLoader()
    mtlLoader.load(MTL_URL, (materials) => {
      materials.preload()

      const objLoader = new OBJLoader()
      objLoader.setMaterials(materials)
      objLoader.load(OBJ_URL, (loadedObject) => {
        loadedObject.updateMatrixWorld(true)

        loadedObject.traverse((child) => {
          if (!child.isMesh) return
          child.castShadow = true
          child.receiveShadow = true
          child.frustumCulled = false
        })

        setModel(loadedObject)
      })
    })
  }, [])

  if (!model) return null

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={model} scale={modelScale} />
    </group>
  )
}

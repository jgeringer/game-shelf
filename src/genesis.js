import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const MODEL_URL = '/models/sega_genesis_model_2__sega_mega_drive/scene.gltf'

const container = document.getElementById('app')
const scene = new THREE.Scene()
scene.background = new THREE.Color('#101015')

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(2.2, 1.6, 3.8)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.shadowMap.enabled = true
container.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 0.35, 0)
controls.minDistance = 1.2
controls.maxDistance = 12

scene.add(new THREE.AmbientLight('#ffffff', 0.75))

const keyLight = new THREE.DirectionalLight('#fff7ef', 1.4)
keyLight.position.set(4, 6, 5)
keyLight.castShadow = true
scene.add(keyLight)

const fillLight = new THREE.DirectionalLight('#98b8ff', 0.35)
fillLight.position.set(-5, 2, 3)
scene.add(fillLight)

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 18),
  new THREE.MeshStandardMaterial({ color: '#17171d', roughness: 1 })
)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.001
ground.receiveShadow = true
scene.add(ground)

const loader = new GLTFLoader()
loader.load(
  MODEL_URL,
  (gltf) => {
    const root = gltf.scene
    root.updateMatrixWorld(true)

    root.traverse((obj) => {
      if (!obj.isMesh) return
      obj.castShadow = true
      obj.receiveShadow = true
      obj.frustumCulled = false
    })

    const box = new THREE.Box3().setFromObject(root)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    root.position.x -= center.x
    root.position.y -= box.min.y
    root.position.z -= center.z

    const width = Math.max(size.x, size.z) || 1
    const fitScale = 2.5 / width
    root.scale.setScalar(fitScale)

    scene.add(root)
    controls.target.set(0, 0.35, 0)
    controls.update()
  },
  undefined,
  (err) => {
    console.error('Failed to load Genesis GLTF:', err)
  }
)

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', onResize)

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})

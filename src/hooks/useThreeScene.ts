import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

interface ThreeSceneState {
  scene: THREE.Scene | null
  camera: THREE.PerspectiveCamera | null
  renderer: THREE.WebGLRenderer | null
  controls: OrbitControls | null
}

export function useThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationIdRef = useRef<number | null>(null)
  const initializedRef = useRef(false)

  const [state, setState] = useState<ThreeSceneState>({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
  })

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(15, 15, 15)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // Controls - OrbitControls for orbit, pan, and zoom
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = true

    // Zoom settings (mouse wheel)
    controls.enableZoom = true
    controls.zoomSpeed = 1.0
    controls.minDistance = 0.5
    controls.maxDistance = 1000

    // Rotation settings (left mouse button drag)
    controls.enableRotate = true
    controls.rotateSpeed = 0.8
    controls.minPolarAngle = 0 // Allow looking from directly above
    controls.maxPolarAngle = Math.PI // Allow looking from directly below

    // Pan settings (right mouse button drag or Shift+left drag)
    controls.enablePan = true
    controls.panSpeed = 1.0

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222)
    scene.add(gridHelper)

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    // Update state
    setState({ scene, camera, renderer, controls })

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!container) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      initializedRef.current = false
    }
  }, [])

  const fitCameraToObject = useCallback((object: THREE.Object3D) => {
    const { camera, controls } = state
    if (!camera || !controls) return

    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = camera.fov * (Math.PI / 180)
    const cameraDistance = maxDim / (2 * Math.tan(fov / 2))

    camera.position.set(
      center.x + cameraDistance,
      center.y + cameraDistance,
      center.z + cameraDistance
    )

    controls.target.copy(center)
    controls.update()
  }, [state])

  return {
    containerRef,
    scene: state.scene,
    camera: state.camera,
    renderer: state.renderer,
    controls: state.controls,
    fitCameraToObject,
  }
}

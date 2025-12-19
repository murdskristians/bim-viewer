import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

interface ThreeSceneState {
  scene: THREE.Scene | null
  camera: THREE.PerspectiveCamera | null
  renderer: THREE.WebGLRenderer | null
  controls: OrbitControls | null
}

// Movement direction for UI feedback
export type MovementDirection = 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down' | 'zoomIn' | 'zoomOut' | 'rotate' | null

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

  const [activeMovement, setActiveMovement] = useState<MovementDirection>(null)

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

    // Disable default pan - we'll use custom forward/backward movement
    controls.enablePan = false

    // Custom mouse drag for GTA-style movement
    let isRightMouseDown = false
    let isLeftMouseDown = false
    let lastMouseX = 0
    let lastMouseY = 0
    const moveSpeed = 0.05

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) { // Left mouse button
        isLeftMouseDown = true
      }
      if (event.button === 2) { // Right mouse button
        isRightMouseDown = true
        lastMouseX = event.clientX
        lastMouseY = event.clientY
        event.preventDefault()
      }
      // Both buttons = up/down mode - disable orbit rotation
      if (isLeftMouseDown && isRightMouseDown) {
        controls.enableRotate = false
        lastMouseY = event.clientY
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        isLeftMouseDown = false
      }
      if (event.button === 2) {
        isRightMouseDown = false
      }
      // Re-enable rotation when either button is released
      if (!isLeftMouseDown || !isRightMouseDown) {
        controls.enableRotate = true
      }
      // Clear movement indicator when mouse released
      if (!isLeftMouseDown && !isRightMouseDown) {
        setActiveMovement(null)
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      // Both buttons held = up/down movement
      if (isLeftMouseDown && isRightMouseDown) {
        const deltaY = event.clientY - lastMouseY // Drag down = move up (inverted)
        lastMouseY = event.clientY

        // Determine movement direction for UI feedback
        if (Math.abs(deltaY) > 0.5) {
          setActiveMovement(deltaY > 0 ? 'up' : 'down')
        }

        // Move camera and target vertically
        const movement = new THREE.Vector3(0, deltaY * moveSpeed, 0)
        camera.position.add(movement)
        controls.target.add(movement)
        return
      }

      // Only left button = rotation (OrbitControls handles this, just show feedback)
      if (isLeftMouseDown && !isRightMouseDown) {
        setActiveMovement('rotate')
        return
      }

      // Only right button = forward/backward/strafe
      if (!isRightMouseDown) return

      const deltaX = lastMouseX - event.clientX // Drag left = strafe left
      const deltaY = event.clientY - lastMouseY // Drag down = move forward
      lastMouseX = event.clientX
      lastMouseY = event.clientY

      // Determine dominant movement direction for UI feedback
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 0.5) {
        setActiveMovement(deltaY > 0 ? 'forward' : 'backward')
      } else if (Math.abs(deltaX) > 0.5) {
        setActiveMovement(deltaX > 0 ? 'left' : 'right')
      }

      // Get camera's forward direction (horizontal only)
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()

      // Get right direction
      const right = new THREE.Vector3()
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      // Calculate total movement
      const movement = new THREE.Vector3()
      movement.add(forward.clone().multiplyScalar(deltaY * moveSpeed)) // Forward/backward
      movement.add(right.clone().multiplyScalar(deltaX * moveSpeed))   // Left/right strafe

      // Move camera and target together
      camera.position.add(movement)
      controls.target.add(movement)
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault() // Prevent context menu on right-click
    }

    // Track zoom via mouse wheel
    let zoomTimeout: ReturnType<typeof setTimeout> | null = null
    const handleWheel = (event: WheelEvent) => {
      // deltaY > 0 means scrolling down = zoom out, deltaY < 0 means scrolling up = zoom in
      setActiveMovement(event.deltaY > 0 ? 'zoomOut' : 'zoomIn')

      // Clear the zoom indicator after a short delay
      if (zoomTimeout) clearTimeout(zoomTimeout)
      zoomTimeout = setTimeout(() => {
        setActiveMovement(null)
      }, 150)
    }

    renderer.domElement.addEventListener('mousedown', handleMouseDown)
    renderer.domElement.addEventListener('mouseup', handleMouseUp)
    renderer.domElement.addEventListener('mousemove', handleMouseMove)
    renderer.domElement.addEventListener('contextmenu', handleContextMenu)
    renderer.domElement.addEventListener('wheel', handleWheel)
    window.addEventListener('mouseup', handleMouseUp) // Catch mouseup outside canvas

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
      window.removeEventListener('mouseup', handleMouseUp)
      renderer.domElement.removeEventListener('mousedown', handleMouseDown)
      renderer.domElement.removeEventListener('mouseup', handleMouseUp)
      renderer.domElement.removeEventListener('mousemove', handleMouseMove)
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu)
      renderer.domElement.removeEventListener('wheel', handleWheel)
      if (zoomTimeout) clearTimeout(zoomTimeout)
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

  const fitCameraToObject = useCallback((objectOrBox: THREE.Object3D | THREE.Box3) => {
    const { camera, controls } = state
    if (!camera || !controls) return

    const box = objectOrBox instanceof THREE.Box3
      ? objectOrBox
      : new THREE.Box3().setFromObject(objectOrBox)

    if (box.isEmpty()) return

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
    activeMovement,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Box } from '@mui/material'
import { useThreeScene } from '../hooks/useThreeScene'
import { loadIFCFile, getElementProperties, getIFCLoader } from '../utils/ifcLoader'
import { extractIFCFrom7z } from '../utils/sevenZipLoader'
import { loadGLTFFile } from '../utils/gltfLoader'
import {
  createSampleHouse,
  setFloorVisibility,
  getCameraPositionForFloor,
  getCameraTargetForFloor,
} from '../utils/sampleHouse'
import { Toolbar, type SampleType } from './Toolbar'
import { PropertiesPanel } from './PropertiesPanel'
import { ModelList } from './ModelList'
import { FloorSelector } from './FloorSelector'
import { RvtHelpDialog } from './RvtHelpDialog'
import { CameraControls } from './CameraControls'
import type { LoadedModel, ElementProperties, IFCModel } from '../types/bim'

const HIGHLIGHT_MATERIAL = new THREE.MeshBasicMaterial({
  color: 0xff9800,
  transparent: true,
  opacity: 0.6,
  depthTest: false,
})

// Sample IFC file (compressed in 7z format to fit GitHub's file size limit)
const SAMPLE_BUILDING_7Z_URL = '/samples/demo-building.7z'

export function Viewer() {
  const [models, setModels] = useState<LoadedModel[]>([])
  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true)

  // Sample state - track which samples are loaded
  const [loadedSamples, setLoadedSamples] = useState<SampleType[]>([])
  const [availableFloors, setAvailableFloors] = useState<number[]>([])
  const [selectedFloors, setSelectedFloors] = useState<number[]>([1, 2, 3])
  const floorsRef = useRef<THREE.Group[]>([])

  // RVT dialog state
  const [rvtDialogOpen, setRvtDialogOpen] = useState(false)
  const [rvtFileName, setRvtFileName] = useState<string | undefined>()

  const highlightedRef = useRef<THREE.Object3D | null>(null)

  const { containerRef, scene, camera, controls, fitCameraToObject, activeMovement } = useThreeScene()

  // Handle loading sample house (3D generated)
  const handleLoadSampleHouse = useCallback(() => {
    if (!scene || !camera || !controls || loadedSamples.includes('house')) return

    const { house, floors } = createSampleHouse()
    scene.add(house)

    floorsRef.current = floors
    setAvailableFloors([1, 2, 3])
    setSelectedFloors([1, 2, 3])
    setLoadedSamples((prev) => [...prev, 'house'])

    const cameraPos = getCameraPositionForFloor(1)
    const cameraTarget = getCameraTargetForFloor(1)

    camera.position.copy(cameraPos)
    controls.target.copy(cameraTarget)
    controls.update()

    const newModel: LoadedModel = {
      id: 'sample-house',
      name: 'Sample House',
      type: 'gltf',
      object: house,
      visible: true,
    }
    setModels((prev) => [...prev, newModel])
  }, [scene, camera, controls, loadedSamples])

  // Handle loading sample building (IFC file from compressed 7z)
  const handleLoadSampleBuilding = useCallback(async () => {
    if (!scene || loadedSamples.includes('building')) return

    setIsLoading(true)
    setLoadingProgress(0)

    try {
      // Extract IFC from 7z archive (progress 0-50%)
      const extractProgress = (p: number) => setLoadingProgress(p * 0.5)
      const ifcFile = await extractIFCFrom7z(SAMPLE_BUILDING_7Z_URL, extractProgress)

      // Load the extracted IFC file (progress 50-100%)
      const loadProgress = (p: number) => setLoadingProgress(50 + p * 0.5)
      const model = await loadIFCFile(ifcFile, loadProgress)

      model.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      const newModel: LoadedModel = {
        id: 'sample-building',
        name: 'Sample Building',
        type: 'ifc',
        object: model,
        visible: true,
      }

      scene.add(model)
      setModels((prev) => [...prev, newModel])
      setLoadedSamples((prev) => [...prev, 'building'])
      fitCameraToObject(model)
    } catch (error) {
      console.error('Error loading sample building:', error)
      alert('Failed to load sample building. Please check the console for details.')
    } finally {
      setIsLoading(false)
    }
  }, [scene, loadedSamples, fitCameraToObject])

  // Handle loading sample based on type
  const handleLoadSample = useCallback((type: SampleType) => {
    if (type === 'house') {
      handleLoadSampleHouse()
    } else if (type === 'building') {
      handleLoadSampleBuilding()
    }
  }, [handleLoadSampleHouse, handleLoadSampleBuilding])

  // Handle floor selection change
  const handleFloorChange = useCallback((floors: number[]) => {
    setSelectedFloors(floors)
    setFloorVisibility(floorsRef.current, floors)

    // Move camera to focus on the lowest selected floor
    if (floors.length > 0 && camera && controls) {
      const lowestFloor = Math.min(...floors)
      const cameraTarget = getCameraTargetForFloor(lowestFloor)
      controls.target.copy(cameraTarget)
      controls.update()
    }
  }, [camera, controls])

  // Handle IFC model loading
  const handleLoadIFC = useCallback(async (file: File) => {
    if (!scene) return

    setIsLoading(true)
    setLoadingProgress(0)

    try {
      const model = await loadIFCFile(file, setLoadingProgress)

      // Enable shadows
      model.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      const newModel: LoadedModel = {
        id: `ifc-${Date.now()}`,
        name: file.name,
        type: 'ifc',
        object: model,
        visible: true,
      }

      scene.add(model)
      setModels((prev) => [...prev, newModel])
      fitCameraToObject(model)
    } catch (error) {
      console.error('Error loading IFC file:', error)
      alert('Failed to load IFC file. Please check the console for details.')
    } finally {
      setIsLoading(false)
    }
  }, [scene, fitCameraToObject])

  // Handle glTF model loading
  const handleLoadGLTF = useCallback(async (file: File) => {
    if (!scene) return

    setIsLoading(true)
    setLoadingProgress(0)

    try {
      const model = await loadGLTFFile(file, setLoadingProgress)

      const newModel: LoadedModel = {
        id: `gltf-${Date.now()}`,
        name: file.name,
        type: 'gltf',
        object: model,
        visible: true,
      }

      scene.add(model)
      setModels((prev) => [...prev, newModel])
      fitCameraToObject(model)
    } catch (error) {
      console.error('Error loading glTF file:', error)
      alert('Failed to load glTF file. Please check the console for details.')
    } finally {
      setIsLoading(false)
    }
  }, [scene, fitCameraToObject])

  // Handle RVT file detection
  const handleRvtDetected = useCallback((fileName: string) => {
    setRvtFileName(fileName)
    setRvtDialogOpen(true)
  }, [])

  // Handle model visibility toggle
  const handleToggleVisibility = useCallback((modelId: string) => {
    setModels((prev) =>
      prev.map((model) => {
        if (model.id === modelId) {
          const newVisible = !model.visible
          // Directly set the Three.js object visibility
          model.object.visible = newVisible
          return { ...model, visible: newVisible }
        }
        return model
      })
    )
  }, [])

  // Handle model removal
  const handleRemoveModel = useCallback((modelId: string) => {
    const model = models.find((m) => m.id === modelId)
    if (model && scene) {
      scene.remove(model.object)
      setModels((prev) => prev.filter((m) => m.id !== modelId))

      // If removing sample house, reset floor state
      if (modelId === 'sample-house') {
        setLoadedSamples((prev) => prev.filter((s) => s !== 'house'))
        setAvailableFloors([])
        setSelectedFloors([1, 2, 3])
        floorsRef.current = []
      }

      if (modelId === 'sample-building') {
        setLoadedSamples((prev) => prev.filter((s) => s !== 'building'))
      }

      // Clear selection if the removed model contained the selected element
      setSelectedElement(null)
      if (highlightedRef.current) {
        scene.remove(highlightedRef.current)
        highlightedRef.current = null
      }
    }
  }, [models, scene])

  // Clear highlight
  const clearHighlight = useCallback(() => {
    if (highlightedRef.current && scene) {
      scene.remove(highlightedRef.current)
      highlightedRef.current = null
    }
  }, [scene])

  // Handle element selection via raycasting
  useEffect(() => {
    if (!scene || !camera) return

    const container = containerRef.current
    if (!container) return

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const handleClick = async (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      // Find IFC models
      const ifcModels = models
        .filter((m) => m.type === 'ifc' && m.visible)
        .map((m) => m.object as IFCModel)

      for (const model of ifcModels) {
        const intersects = raycaster.intersectObject(model, true)

        if (intersects.length > 0) {
          const intersect = intersects[0]
          const face = intersect.face

          if (face) {
            try {
              const loader = await getIFCLoader()
              const expressID = loader.ifcManager.getExpressId(
                model.geometry,
                face.a
              )

              if (expressID !== undefined && expressID !== null) {
                // Get properties
                const props = await getElementProperties(model.modelID, expressID)
                setSelectedElement(props)

                // Create highlight subset
                clearHighlight()

                const subset = await loader.ifcManager.createSubset({
                  modelID: model.modelID,
                  ids: [expressID],
                  material: HIGHLIGHT_MATERIAL,
                  scene,
                  removePrevious: true,
                  customID: 'highlight',
                })

                highlightedRef.current = subset
                setPropertiesPanelOpen(true)
                return
              }
            } catch (error) {
              console.error('Error selecting element:', error)
            }
          }
        }
      }

      // No IFC element hit - check glTF/sample models for basic info
      const gltfObjects = models
        .filter((m) => m.type === 'gltf' && m.visible)
        .map((m) => m.object)

      for (const model of gltfObjects) {
        const intersects = raycaster.intersectObject(model, true)

        if (intersects.length > 0) {
          const mesh = intersects[0].object
          setSelectedElement({
            expressID: mesh.id,
            type: mesh.type,
            name: mesh.name || 'Unnamed Object',
            properties: {
              uuid: mesh.uuid,
              position: `${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)}`,
              rotation: `${mesh.rotation.x.toFixed(2)}, ${mesh.rotation.y.toFixed(2)}, ${mesh.rotation.z.toFixed(2)}`,
            },
          })
          setPropertiesPanelOpen(true)
          return
        }
      }

      // Click on empty space - clear selection
      clearHighlight()
      setSelectedElement(null)
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [scene, camera, models, containerRef, clearHighlight])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar
        onLoadIFC={handleLoadIFC}
        onLoadGLTF={handleLoadGLTF}
        onLoadSample={handleLoadSample}
        onRvtDetected={handleRvtDetected}
        onToggleProperties={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        propertiesPanelOpen={propertiesPanelOpen}
        loadedSamples={loadedSamples}
      />

      <Box sx={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Box
          ref={containerRef}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: propertiesPanelOpen ? '360px' : 0,
            bottom: 0,
            transition: 'right 0.3s',
          }}
        />

        <ModelList
          models={models}
          onToggleVisibility={handleToggleVisibility}
          onRemove={handleRemoveModel}
        />

        {loadedSamples.includes('house') && (
          <FloorSelector
            floors={availableFloors}
            selectedFloors={selectedFloors}
            onFloorChange={handleFloorChange}
          />
        )}

        <CameraControls
          camera={camera}
          controls={controls}
          activeMovement={activeMovement}
        />

        <PropertiesPanel
          open={propertiesPanelOpen}
          element={selectedElement}
          onClose={() => setPropertiesPanelOpen(false)}
        />
      </Box>

      <RvtHelpDialog
        open={rvtDialogOpen}
        onClose={() => setRvtDialogOpen(false)}
        fileName={rvtFileName}
      />
    </Box>
  )
}

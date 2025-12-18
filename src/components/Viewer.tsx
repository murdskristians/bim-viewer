import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Box } from '@mui/material'
import { useThreeScene } from '../hooks/useThreeScene'
import { loadIFCFile, getElementProperties, getIFCLoader } from '../utils/ifcLoader'
import { loadGLTFFile } from '../utils/gltfLoader'
import { Toolbar } from './Toolbar'
import { PropertiesPanel } from './PropertiesPanel'
import { ModelList } from './ModelList'
import type { LoadedModel, ElementProperties, IFCModel } from '../types/bim'

const HIGHLIGHT_MATERIAL = new THREE.MeshBasicMaterial({
  color: 0xff9800,
  transparent: true,
  opacity: 0.6,
  depthTest: false,
})

export function Viewer() {
  const [models, setModels] = useState<LoadedModel[]>([])
  const [selectedElement, setSelectedElement] = useState<ElementProperties | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true)

  const highlightedRef = useRef<THREE.Object3D | null>(null)

  const { containerRef, scene, camera, fitCameraToObject } = useThreeScene()

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

  // Handle model visibility toggle
  const handleToggleVisibility = useCallback((modelId: string) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === modelId
          ? { ...model, visible: !model.visible, object: { ...model.object, visible: !model.visible } as typeof model.object }
          : model
      )
    )

    const model = models.find((m) => m.id === modelId)
    if (model) {
      model.object.visible = !model.visible
    }
  }, [models])

  // Handle model removal
  const handleRemoveModel = useCallback((modelId: string) => {
    const model = models.find((m) => m.id === modelId)
    if (model && scene) {
      scene.remove(model.object)
      setModels((prev) => prev.filter((m) => m.id !== modelId))

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

      // No IFC element hit - check glTF models for basic info
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
        onToggleProperties={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        propertiesPanelOpen={propertiesPanelOpen}
      />

      <Box sx={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            transition: 'margin-right 0.3s',
            marginRight: propertiesPanelOpen ? '360px' : 0,
          }}
        />

        <ModelList
          models={models}
          onToggleVisibility={handleToggleVisibility}
          onRemove={handleRemoveModel}
        />

        <PropertiesPanel
          open={propertiesPanelOpen}
          element={selectedElement}
          onClose={() => setPropertiesPanelOpen(false)}
        />
      </Box>
    </Box>
  )
}

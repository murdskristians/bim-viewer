import type { Object3D, Mesh, BufferGeometry, Material } from 'three'

export interface ElementProperties {
  expressID: number
  type: string
  name?: string
  description?: string
  globalId?: string
  properties: Record<string, unknown>
}

// IFCModel type - extends Mesh with IFC-specific properties
export interface IFCModel extends Mesh<BufferGeometry, Material | Material[]> {
  modelID: number
  ifcManager: unknown | null
}

export interface LoadedModel {
  id: string
  name: string
  type: 'ifc' | 'gltf'
  object: IFCModel | Object3D
  visible: boolean
}

export interface ViewerState {
  models: LoadedModel[]
  selectedElement: ElementProperties | null
  isLoading: boolean
  loadingProgress: number
}

export interface ViewerContextType extends ViewerState {
  loadIFCModel: (file: File) => Promise<void>
  loadGLTFModel: (file: File) => Promise<void>
  selectElement: (expressID: number, modelId: string) => Promise<void>
  clearSelection: () => void
  toggleModelVisibility: (modelId: string) => void
  removeModel: (modelId: string) => void
}

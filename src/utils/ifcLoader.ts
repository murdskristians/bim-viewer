import { IFCLoader } from 'web-ifc-three'
import type { ElementProperties, IFCModel } from '../types/bim'

let ifcLoader: IFCLoader | null = null

export async function getIFCLoader(): Promise<IFCLoader> {
  if (ifcLoader) return ifcLoader

  ifcLoader = new IFCLoader()
  await ifcLoader.ifcManager.setWasmPath('https://unpkg.com/web-ifc@0.0.74/')

  return ifcLoader
}

export async function loadIFCFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<IFCModel> {
  const loader = await getIFCLoader()

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)

    loader.load(
      url,
      (model) => {
        URL.revokeObjectURL(url)
        resolve(model)
      },
      (progress) => {
        if (progress.total > 0) {
          onProgress?.((progress.loaded / progress.total) * 100)
        }
      },
      (error) => {
        URL.revokeObjectURL(url)
        reject(error)
      }
    )
  })
}

export async function getElementProperties(
  modelId: number,
  expressID: number
): Promise<ElementProperties | null> {
  const loader = await getIFCLoader()

  try {
    const props = await loader.ifcManager.getItemProperties(modelId, expressID, true)
    const typeProps = await loader.ifcManager.getTypeProperties(modelId, expressID)

    const elementType = props.constructor?.name || 'Unknown'
    const name = props.Name?.value || props.LongName?.value || undefined
    const description = props.Description?.value || undefined
    const globalId = props.GlobalId?.value || undefined

    const properties: Record<string, unknown> = {}

    // Extract relevant properties
    for (const [key, value] of Object.entries(props)) {
      if (key === 'expressID' || key === 'type') continue
      if (value && typeof value === 'object' && 'value' in value) {
        properties[key] = value.value
      } else if (value !== null && value !== undefined && typeof value !== 'object') {
        properties[key] = value
      }
    }

    // Add type properties
    if (typeProps && typeProps.length > 0) {
      for (const typeProp of typeProps) {
        if (typeProp.HasPropertySets) {
          properties['TypeProperties'] = typeProp
        }
      }
    }

    return {
      expressID,
      type: elementType,
      name,
      description,
      globalId,
      properties,
    }
  } catch (error) {
    console.error('Error getting element properties:', error)
    return null
  }
}

export async function highlightElement(
  modelId: number,
  expressID: number,
  highlight: boolean
): Promise<void> {
  const loader = await getIFCLoader()

  if (highlight) {
    await loader.ifcManager.createSubset({
      modelID: modelId,
      ids: [expressID],
      material: undefined,
      scene: undefined as never,
      removePrevious: true,
      customID: 'highlight',
    })
  }
}

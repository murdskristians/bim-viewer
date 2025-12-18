import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

let gltfLoader: GLTFLoader | null = null

export function getGLTFLoader(): GLTFLoader {
  if (gltfLoader) return gltfLoader

  gltfLoader = new GLTFLoader()

  // Set up DRACO loader for compressed models
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
  gltfLoader.setDRACOLoader(dracoLoader)

  return gltfLoader
}

export async function loadGLTFFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<THREE.Object3D> {
  const loader = getGLTFLoader()

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)

    loader.load(
      url,
      (gltf) => {
        URL.revokeObjectURL(url)

        // Enable shadows for all meshes
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        resolve(gltf.scene)
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

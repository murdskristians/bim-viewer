import SevenZip from '7z-wasm'

let sevenZipInstance: Awaited<ReturnType<typeof SevenZip>> | null = null

async function getSevenZip() {
  if (!sevenZipInstance) {
    sevenZipInstance = await SevenZip({
      // Point to the WASM file in the public folder
      locateFile: (file: string) => {
        if (file.endsWith('.wasm')) {
          return '/7zz.wasm'
        }
        return file
      },
    })
  }
  return sevenZipInstance
}

export async function extractIFCFrom7z(
  url: string,
  onProgress?: (progress: number) => void
): Promise<File> {
  onProgress?.(5)

  // Fetch the 7z file
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch 7z file: ${response.statusText}`)
  }

  onProgress?.(20)

  const arrayBuffer = await response.arrayBuffer()
  const archiveData = new Uint8Array(arrayBuffer)

  onProgress?.(30)

  // Initialize 7z-wasm
  const sevenZip = await getSevenZip()

  onProgress?.(40)

  // Write archive to virtual filesystem
  const archiveName = 'archive.7z'
  sevenZip.FS.writeFile(archiveName, archiveData)

  onProgress?.(50)

  // Extract the archive
  sevenZip.callMain(['x', archiveName, '-y'])

  onProgress?.(70)

  // Find the IFC file in the extracted contents
  const files = sevenZip.FS.readdir('.')
  const ifcFileName = files.find(
    (f: string) => f.endsWith('.ifc') || f.endsWith('.IFC')
  )

  if (!ifcFileName) {
    throw new Error('No IFC file found in the archive')
  }

  onProgress?.(80)

  // Read the extracted IFC file
  const ifcData = sevenZip.FS.readFile(ifcFileName) as Uint8Array

  onProgress?.(90)

  // Create a File object from the data (slice to ensure proper ArrayBuffer type)
  const blob = new Blob([new Uint8Array(ifcData)], { type: 'application/x-step' })
  const file = new File([blob], ifcFileName, { type: 'application/x-step' })

  // Cleanup virtual filesystem
  sevenZip.FS.unlink(archiveName)
  sevenZip.FS.unlink(ifcFileName)

  onProgress?.(100)

  return file
}

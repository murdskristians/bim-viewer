import * as THREE from 'three'

const FLOOR_HEIGHT = 3
const WALL_THICKNESS = 0.2
const HOUSE_WIDTH = 12
const HOUSE_DEPTH = 10

interface HouseElements {
  floors: THREE.Group[]
  house: THREE.Group
}

function createMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  })
}

function createGlassMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  })
}

function createBox(
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  name: string
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/**
 * Creates a wall with an optional rectangular opening (for door or window)
 * The wall is built as a single shape with a hole cut out
 */
function createWallWithOpening(
  width: number,
  height: number,
  thickness: number,
  material: THREE.Material,
  name: string,
  opening?: {
    x: number      // Center X position of opening relative to wall center
    y: number      // Bottom Y position of opening relative to wall bottom
    width: number
    height: number
  }
): THREE.Mesh {
  // Create wall shape
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2, 0)
  shape.lineTo(width / 2, 0)
  shape.lineTo(width / 2, height)
  shape.lineTo(-width / 2, height)
  shape.closePath()

  // Cut opening if specified
  if (opening) {
    const hole = new THREE.Path()
    const left = opening.x - opening.width / 2
    const right = opening.x + opening.width / 2
    const bottom = opening.y
    const top = opening.y + opening.height

    hole.moveTo(left, bottom)
    hole.lineTo(right, bottom)
    hole.lineTo(right, top)
    hole.lineTo(left, top)
    hole.closePath()
    shape.holes.push(hole)
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  })

  // Center the geometry on Z axis
  geometry.translate(0, 0, -thickness / 2)

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function createFloorGroup(floorNumber: number, baseY: number): THREE.Group {
  const floor = new THREE.Group()
  floor.name = `Floor ${floorNumber}`
  floor.userData.floorNumber = floorNumber

  const wallMaterial = createMaterial(0xe8e4d9) // Light beige
  const floorMaterial = createMaterial(0xc4a574) // Wood color
  const glassMaterial = createGlassMaterial()
  const doorMaterial = createMaterial(0x6b4423) // Brown wood

  const halfWidth = HOUSE_WIDTH / 2
  const halfDepth = HOUSE_DEPTH / 2
  const wallHeight = FLOOR_HEIGHT - 0.15
  const floorTop = baseY + 0.15

  // Door and window dimensions
  const doorWidth = 1.0
  const doorHeight = 2.1
  const windowWidth = 1.2
  const windowHeight = 1.0
  const windowSillHeight = 1.0

  // ========== FLOOR SLAB ==========
  const floorSlab = createBox(HOUSE_WIDTH, 0.15, HOUSE_DEPTH, floorMaterial, 'Floor Slab')
  floorSlab.position.set(0, baseY + 0.075, 0)
  floor.add(floorSlab)

  // ========== EXTERIOR WALLS ==========

  // FRONT WALL (facing -Z direction)
  const frontWallZ = -halfDepth + WALL_THICKNESS / 2
  if (floorNumber === 1) {
    // Ground floor with door
    const frontWall = createWallWithOpening(
      HOUSE_WIDTH, wallHeight, WALL_THICKNESS, wallMaterial, 'Front Wall',
      { x: 0, y: 0, width: doorWidth, height: doorHeight }
    )
    frontWall.position.set(0, floorTop, frontWallZ)
    floor.add(frontWall)

    // Front door
    const frontDoor = createBox(doorWidth - 0.05, doorHeight - 0.05, 0.05, doorMaterial, 'Front Door')
    frontDoor.position.set(0, floorTop + doorHeight / 2, frontWallZ)
    floor.add(frontDoor)
  } else {
    // Upper floor with window
    const frontWall = createWallWithOpening(
      HOUSE_WIDTH, wallHeight, WALL_THICKNESS, wallMaterial, 'Front Wall',
      { x: 0, y: windowSillHeight, width: windowWidth, height: windowHeight }
    )
    frontWall.position.set(0, floorTop, frontWallZ)
    floor.add(frontWall)

    // Front window glass
    const frontWindow = createBox(windowWidth - 0.05, windowHeight - 0.05, 0.02, glassMaterial, 'Front Window')
    frontWindow.position.set(0, floorTop + windowSillHeight + windowHeight / 2, frontWallZ)
    floor.add(frontWindow)
  }

  // BACK WALL (facing +Z direction) - with two windows
  const backWallZ = halfDepth - WALL_THICKNESS / 2
  const backWindowOffsetX = 3

  // Create back wall shape with two window holes
  const backShape = new THREE.Shape()
  backShape.moveTo(-halfWidth, 0)
  backShape.lineTo(halfWidth, 0)
  backShape.lineTo(halfWidth, wallHeight)
  backShape.lineTo(-halfWidth, wallHeight)
  backShape.closePath()

  // Left window hole
  const leftHole = new THREE.Path()
  leftHole.moveTo(-backWindowOffsetX - windowWidth / 2, windowSillHeight)
  leftHole.lineTo(-backWindowOffsetX + windowWidth / 2, windowSillHeight)
  leftHole.lineTo(-backWindowOffsetX + windowWidth / 2, windowSillHeight + windowHeight)
  leftHole.lineTo(-backWindowOffsetX - windowWidth / 2, windowSillHeight + windowHeight)
  leftHole.closePath()
  backShape.holes.push(leftHole)

  // Right window hole
  const rightHole = new THREE.Path()
  rightHole.moveTo(backWindowOffsetX - windowWidth / 2, windowSillHeight)
  rightHole.lineTo(backWindowOffsetX + windowWidth / 2, windowSillHeight)
  rightHole.lineTo(backWindowOffsetX + windowWidth / 2, windowSillHeight + windowHeight)
  rightHole.lineTo(backWindowOffsetX - windowWidth / 2, windowSillHeight + windowHeight)
  rightHole.closePath()
  backShape.holes.push(rightHole)

  const backGeometry = new THREE.ExtrudeGeometry(backShape, {
    depth: WALL_THICKNESS,
    bevelEnabled: false,
  })
  backGeometry.translate(0, 0, -WALL_THICKNESS / 2)

  const backWall = new THREE.Mesh(backGeometry, wallMaterial)
  backWall.name = 'Back Wall'
  backWall.position.set(0, floorTop, backWallZ)
  backWall.castShadow = true
  backWall.receiveShadow = true
  floor.add(backWall)

  // Back window glass - left
  const backWindowLeft = createBox(windowWidth - 0.05, windowHeight - 0.05, 0.02, glassMaterial, 'Back Window Left')
  backWindowLeft.position.set(-backWindowOffsetX, floorTop + windowSillHeight + windowHeight / 2, backWallZ)
  floor.add(backWindowLeft)

  // Back window glass - right
  const backWindowRight = createBox(windowWidth - 0.05, windowHeight - 0.05, 0.02, glassMaterial, 'Back Window Right')
  backWindowRight.position.set(backWindowOffsetX, floorTop + windowSillHeight + windowHeight / 2, backWallZ)
  floor.add(backWindowRight)

  // LEFT WALL (facing -X direction) - with one window
  const leftWallX = -halfWidth + WALL_THICKNESS / 2

  const leftWall = createWallWithOpening(
    HOUSE_DEPTH, wallHeight, WALL_THICKNESS, wallMaterial, 'Left Wall',
    { x: 0, y: windowSillHeight, width: windowWidth, height: windowHeight }
  )
  leftWall.position.set(leftWallX, floorTop, 0)
  leftWall.rotation.y = Math.PI / 2
  floor.add(leftWall)

  // Left window glass
  const leftWindow = createBox(0.02, windowHeight - 0.05, windowWidth - 0.05, glassMaterial, 'Left Window')
  leftWindow.position.set(leftWallX, floorTop + windowSillHeight + windowHeight / 2, 0)
  floor.add(leftWindow)

  // RIGHT WALL (facing +X direction) - with one window
  const rightWallX = halfWidth - WALL_THICKNESS / 2

  const rightWall = createWallWithOpening(
    HOUSE_DEPTH, wallHeight, WALL_THICKNESS, wallMaterial, 'Right Wall',
    { x: 0, y: windowSillHeight, width: windowWidth, height: windowHeight }
  )
  rightWall.position.set(rightWallX, floorTop, 0)
  rightWall.rotation.y = Math.PI / 2
  floor.add(rightWall)

  // Right window glass
  const rightWindow = createBox(0.02, windowHeight - 0.05, windowWidth - 0.05, glassMaterial, 'Right Window')
  rightWindow.position.set(rightWallX, floorTop + windowSillHeight + windowHeight / 2, 0)
  floor.add(rightWindow)

  // ========== INTERIOR WALLS ==========
  // Layout:
  // - Horizontal wall at Z=1 divides front from back (with door in center)
  // - Vertical wall at X=1 divides the front area into two rooms (with door)

  const interiorDoorWidth = 0.9
  const interiorDoorHeight = 2.0
  const horizWallZ = 1
  const vertWallX = 1

  // Horizontal interior wall (runs along X axis at Z=1)
  // This wall spans from left exterior wall to right exterior wall
  const horizWallWidth = HOUSE_WIDTH - WALL_THICKNESS * 2
  const horizWall = createWallWithOpening(
    horizWallWidth, wallHeight, WALL_THICKNESS, wallMaterial, 'Interior Wall Horizontal',
    { x: 0, y: 0, width: interiorDoorWidth, height: interiorDoorHeight }
  )
  horizWall.position.set(0, floorTop, horizWallZ)
  floor.add(horizWall)

  // Interior door in horizontal wall
  const horizDoor = createBox(interiorDoorWidth - 0.05, interiorDoorHeight - 0.05, 0.05, doorMaterial, 'Interior Door 1')
  horizDoor.position.set(0, floorTop + interiorDoorHeight / 2, horizWallZ)
  floor.add(horizDoor)

  // Vertical interior wall (runs along Z axis at X=1)
  // This wall spans from front wall to horizontal interior wall
  const vertWallDepth = halfDepth - WALL_THICKNESS + horizWallZ
  const vertWallCenterZ = (-halfDepth + WALL_THICKNESS + horizWallZ) / 2

  const vertWall = createWallWithOpening(
    vertWallDepth, wallHeight, WALL_THICKNESS, wallMaterial, 'Interior Wall Vertical',
    { x: vertWallDepth / 2 - interiorDoorWidth / 2 - 0.3, y: 0, width: interiorDoorWidth, height: interiorDoorHeight }
  )
  vertWall.position.set(vertWallX, floorTop, vertWallCenterZ)
  vertWall.rotation.y = Math.PI / 2
  floor.add(vertWall)

  // Interior door in vertical wall (near the horizontal wall)
  const vertDoorZ = horizWallZ - interiorDoorWidth / 2 - 0.3
  const vertDoor = createBox(0.05, interiorDoorHeight - 0.05, interiorDoorWidth - 0.05, doorMaterial, 'Interior Door 2')
  vertDoor.position.set(vertWallX, floorTop + interiorDoorHeight / 2, vertDoorZ)
  floor.add(vertDoor)

  // ========== STAIRS (L-shaped staircase in back-right area) ==========
  // Position: starts near the vertical interior wall, goes toward back wall,
  // then turns right toward the right wall
  const stairMaterial = createMaterial(0xb89a78)
  const stringerMaterial = createMaterial(0x8b7355) // Darker wood for stringers

  const stepWidth = 1.0
  const stepDepth = 0.28
  const stepThickness = 0.05
  const riserHeight = 0.19 // Standard riser height ~19cm

  // First flight: 8 steps going from front toward back (along +Z)
  const flight1Steps = 8
  const flight1StartX = vertWallX + WALL_THICKNESS / 2 + stepWidth / 2 + 0.3
  const flight1StartZ = horizWallZ + WALL_THICKNESS / 2 + 0.5

  for (let i = 0; i < flight1Steps; i++) {
    // Step tread
    const step = createBox(stepWidth, stepThickness, stepDepth, stairMaterial, `Stair Step ${i + 1}`)
    step.position.set(
      flight1StartX,
      floorTop + (i + 1) * riserHeight,
      flight1StartZ + i * stepDepth
    )
    floor.add(step)

    // Riser (vertical part)
    const riser = createBox(stepWidth, riserHeight, 0.02, stairMaterial, `Stair Riser ${i + 1}`)
    riser.position.set(
      flight1StartX,
      floorTop + i * riserHeight + riserHeight / 2,
      flight1StartZ + i * stepDepth - stepDepth / 2 + 0.01
    )
    floor.add(riser)
  }

  // Landing platform between flights
  const landingWidth = stepWidth + 0.3
  const landingDepth = stepWidth + 0.3
  const landingHeight = flight1Steps * riserHeight
  const landingX = flight1StartX + (landingWidth - stepWidth) / 2
  const landingZ = flight1StartZ + (flight1Steps - 1) * stepDepth + stepDepth / 2 + landingDepth / 2

  const landing = createBox(landingWidth, stepThickness, landingDepth, stairMaterial, 'Stair Landing')
  landing.position.set(landingX, floorTop + landingHeight, landingZ)
  floor.add(landing)

  // Second flight: 7 steps going from left toward right (along +X)
  const flight2Steps = 7
  const flight2StartX = landingX + landingWidth / 2 + stepDepth / 2
  const flight2StartZ = landingZ

  for (let i = 0; i < flight2Steps; i++) {
    // Step tread
    const step = createBox(stepDepth, stepThickness, stepWidth, stairMaterial, `Stair Step ${flight1Steps + i + 1}`)
    step.position.set(
      flight2StartX + i * stepDepth,
      floorTop + landingHeight + (i + 1) * riserHeight,
      flight2StartZ
    )
    floor.add(step)

    // Riser
    const riser = createBox(0.02, riserHeight, stepWidth, stairMaterial, `Stair Riser ${flight1Steps + i + 1}`)
    riser.position.set(
      flight2StartX + i * stepDepth - stepDepth / 2 + 0.01,
      floorTop + landingHeight + i * riserHeight + riserHeight / 2,
      flight2StartZ
    )
    floor.add(riser)
  }

  // Left stringer (support beam) for first flight
  const stringer1 = createBox(0.05, 0.15, flight1Steps * stepDepth + 0.3, stringerMaterial, 'Stair Stringer Left 1')
  stringer1.position.set(
    flight1StartX - stepWidth / 2 - 0.025,
    floorTop + (flight1Steps * riserHeight) / 2,
    flight1StartZ + (flight1Steps - 1) * stepDepth / 2
  )
  stringer1.rotation.x = Math.atan2(flight1Steps * riserHeight, flight1Steps * stepDepth)
  floor.add(stringer1)

  // Right stringer for first flight
  const stringer2 = createBox(0.05, 0.15, flight1Steps * stepDepth + 0.3, stringerMaterial, 'Stair Stringer Right 1')
  stringer2.position.set(
    flight1StartX + stepWidth / 2 + 0.025,
    floorTop + (flight1Steps * riserHeight) / 2,
    flight1StartZ + (flight1Steps - 1) * stepDepth / 2
  )
  stringer2.rotation.x = Math.atan2(flight1Steps * riserHeight, flight1Steps * stepDepth)
  floor.add(stringer2)

  return floor
}

function createRoofGroup(): THREE.Group {
  const roof = new THREE.Group()
  roof.name = 'Roof'
  roof.userData.floorNumber = 3

  const roofMaterial = createMaterial(0x8b2500) // Terracotta red
  const gableMaterial = createMaterial(0xe8e4d9) // Light beige

  const roofBaseY = FLOOR_HEIGHT * 2 + 0.15
  const roofPeakHeight = 2.5
  const overhang = 0.5

  const halfWidth = HOUSE_WIDTH / 2
  const halfDepth = HOUSE_DEPTH / 2

  // Roof panel dimensions
  const roofLength = HOUSE_DEPTH + overhang * 2
  const roofHalfSpan = halfWidth + overhang
  const roofSlantLength = Math.sqrt(roofHalfSpan ** 2 + roofPeakHeight ** 2)
  const roofAngle = Math.atan2(roofPeakHeight, roofHalfSpan)

  // Left roof panel
  const leftRoof = createBox(roofSlantLength, 0.12, roofLength, roofMaterial, 'Roof Left Panel')
  leftRoof.position.set(
    -roofHalfSpan / 2 * Math.cos(roofAngle),
    roofBaseY + roofPeakHeight / 2,
    0
  )
  leftRoof.rotation.z = roofAngle
  roof.add(leftRoof)

  // Right roof panel
  const rightRoof = createBox(roofSlantLength, 0.12, roofLength, roofMaterial, 'Roof Right Panel')
  rightRoof.position.set(
    roofHalfSpan / 2 * Math.cos(roofAngle),
    roofBaseY + roofPeakHeight / 2,
    0
  )
  rightRoof.rotation.z = -roofAngle
  roof.add(rightRoof)

  // Front gable (triangular wall)
  const gableShape = new THREE.Shape()
  gableShape.moveTo(-halfWidth, 0)
  gableShape.lineTo(0, roofPeakHeight)
  gableShape.lineTo(halfWidth, 0)
  gableShape.closePath()

  const gableGeometry = new THREE.ExtrudeGeometry(gableShape, {
    depth: WALL_THICKNESS,
    bevelEnabled: false,
  })

  const frontGable = new THREE.Mesh(gableGeometry, gableMaterial)
  frontGable.name = 'Front Gable'
  frontGable.position.set(0, roofBaseY, -halfDepth)
  frontGable.castShadow = true
  frontGable.receiveShadow = true
  roof.add(frontGable)

  // Back gable
  const backGable = new THREE.Mesh(gableGeometry, gableMaterial)
  backGable.name = 'Back Gable'
  backGable.position.set(0, roofBaseY, halfDepth + WALL_THICKNESS)
  backGable.rotation.y = Math.PI
  backGable.castShadow = true
  backGable.receiveShadow = true
  roof.add(backGable)

  // Ceiling
  const ceilingMaterial = createMaterial(0xf5f5f0)
  const ceiling = createBox(HOUSE_WIDTH, 0.1, HOUSE_DEPTH, ceilingMaterial, 'Ceiling')
  ceiling.position.set(0, roofBaseY - 0.05, 0)
  roof.add(ceiling)

  return roof
}

export function createSampleHouse(): HouseElements {
  const house = new THREE.Group()
  house.name = 'Sample House'

  const floors: THREE.Group[] = []

  // Ground floor (Floor 1)
  const groundFloor = createFloorGroup(1, 0)
  floors.push(groundFloor)
  house.add(groundFloor)

  // Upper floor (Floor 2)
  const upperFloor = createFloorGroup(2, FLOOR_HEIGHT)
  floors.push(upperFloor)
  house.add(upperFloor)

  // Roof
  const roofGroup = createRoofGroup()
  floors.push(roofGroup)
  house.add(roofGroup)

  return { house, floors }
}

export function setFloorVisibility(floors: THREE.Group[], visibleFloors: number[]): void {
  floors.forEach((floor) => {
    const floorNum = floor.userData.floorNumber as number
    floor.visible = visibleFloors.includes(floorNum)
  })
}

export function getCameraPositionForFloor(floorNumber: number): THREE.Vector3 {
  const y = (floorNumber - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT / 2 + 2
  return new THREE.Vector3(18, y + 8, 18)
}

export function getCameraTargetForFloor(floorNumber: number): THREE.Vector3 {
  const y = (floorNumber - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT / 2
  return new THREE.Vector3(0, y, 0)
}

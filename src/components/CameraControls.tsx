import { Box, IconButton, Tooltip, Paper } from '@mui/material'
import {
  Home as HomeIcon,
  KeyboardArrowUp as TopIcon,
  KeyboardArrowDown as BottomIcon,
  KeyboardArrowLeft as LeftIcon,
  KeyboardArrowRight as RightIcon,
  ArrowUpward as FrontIcon,
  ArrowDownward as BackIcon,
  Add as ZoomInIcon,
  Remove as ZoomOutIcon,
} from '@mui/icons-material'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { MovementDirection } from '../hooks/useThreeScene'

interface CameraControlsProps {
  camera: THREE.PerspectiveCamera | null
  controls: OrbitControls | null
  activeMovement?: MovementDirection
}

export function CameraControls({ camera, controls, activeMovement }: CameraControlsProps) {
  if (!camera || !controls) return null

  const getButtonStyle = (direction: MovementDirection) => ({
    bgcolor: activeMovement === direction ? 'primary.main' : undefined,
    color: activeMovement === direction ? 'primary.contrastText' : undefined,
    '&:hover': {
      bgcolor: activeMovement === direction ? 'primary.dark' : undefined,
    },
  })

  const moveSpeed = 2 // Units to move per click

  // Move camera and target together (like walking in a game)
  const moveCamera = (direction: THREE.Vector3) => {
    // Get camera's forward direction (ignoring Y to keep movement horizontal)
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    // Get right direction
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    // Calculate movement vector based on direction input
    const movement = new THREE.Vector3()
    movement.add(forward.multiplyScalar(direction.z * moveSpeed))
    movement.add(right.multiplyScalar(direction.x * moveSpeed))
    movement.y = direction.y * moveSpeed

    // Move both camera and target together
    camera.position.add(movement)
    controls.target.add(movement)
    controls.update()
  }

  const handleMoveForward = () => {
    moveCamera(new THREE.Vector3(0, 0, 1)) // Forward (into the scene)
  }

  const handleMoveBackward = () => {
    moveCamera(new THREE.Vector3(0, 0, -1)) // Backward
  }

  const handleMoveLeft = () => {
    moveCamera(new THREE.Vector3(-1, 0, 0)) // Left
  }

  const handleMoveRight = () => {
    moveCamera(new THREE.Vector3(1, 0, 0)) // Right
  }

  const handleMoveUp = () => {
    moveCamera(new THREE.Vector3(0, 1, 0)) // Up
  }

  const handleMoveDown = () => {
    moveCamera(new THREE.Vector3(0, -1, 0)) // Down
  }

  const handleHomeView = () => {
    // Reset to isometric-like view
    const target = controls.target.clone()
    const distance = camera.position.distanceTo(target)
    const offset = new THREE.Vector3(1, 0.8, 1).normalize().multiplyScalar(distance)
    camera.position.copy(target).add(offset)
    controls.update()
  }

  const handleZoomIn = () => {
    camera.position.lerp(controls.target, 0.2)
    controls.update()
  }

  const handleZoomOut = () => {
    const distance = camera.position.distanceTo(controls.target)
    const direction = camera.position.clone().sub(controls.target).normalize()
    camera.position.add(direction.multiplyScalar(distance * 0.3))
    controls.update()
  }

  const tooltipSlotProps = {
    popper: {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, -70], // Move tooltip up above the widget
          },
        },
      ],
    },
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Movement controls - like GTA walking */}
      <Box sx={{ p: 0.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.25 }}>
          {/* Row 1: Zoom buttons on sides, Forward in middle */}
          <Tooltip title="Zoom In" placement="top" slotProps={tooltipSlotProps}>
            <IconButton size="small" onClick={handleZoomIn} sx={getButtonStyle('zoomIn')}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move Forward" placement="top" slotProps={tooltipSlotProps}>
            <IconButton size="small" onClick={handleMoveForward} sx={getButtonStyle('forward')}>
              <TopIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out" placement="top" slotProps={tooltipSlotProps}>
            <IconButton size="small" onClick={handleZoomOut} sx={getButtonStyle('zoomOut')}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Row 2: Left, Home, Right */}
          <Tooltip title="Move Left" placement="top" slotProps={tooltipSlotProps}>
            <IconButton size="small" onClick={handleMoveLeft} sx={getButtonStyle('left')}>
              <LeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotate View" placement="top" slotProps={tooltipSlotProps}>
            <IconButton size="small" onClick={handleHomeView} sx={getButtonStyle('rotate')}>
              <HomeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move Right" placement="top" slotProps={tooltipSlotProps}>
            <IconButton size="small" onClick={handleMoveRight} sx={getButtonStyle('right')}>
              <RightIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Row 3: Up, Backward, Down */}
          <Tooltip title="Move Up" placement="top" slotProps={tooltipSlotProps}>
            <IconButton size="small" onClick={handleMoveUp} sx={getButtonStyle('up')}>
              <FrontIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move Backward" placement="top" slotProps={tooltipSlotProps}>
            <IconButton size="small" onClick={handleMoveBackward} sx={getButtonStyle('backward')}>
              <BottomIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move Down" placement="top" slotProps={tooltipSlotProps}>
            <IconButton size="small" onClick={handleMoveDown} sx={getButtonStyle('down')}>
              <BackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  )
}

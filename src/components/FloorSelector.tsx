import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper,
} from '@mui/material'
import LayersIcon from '@mui/icons-material/Layers'

interface FloorSelectorProps {
  floors: number[]
  selectedFloors: number[]
  onFloorChange: (floors: number[]) => void
}

export function FloorSelector({ floors, selectedFloors, onFloorChange }: FloorSelectorProps) {
  if (floors.length === 0) return null

  const handleChange = (_event: React.MouseEvent<HTMLElement>, newFloors: number[]) => {
    // Ensure at least one floor is always selected
    if (newFloors.length > 0) {
      onFloorChange(newFloors)
    }
  }

  const getFloorLabel = (floor: number): string => {
    if (floor === 3) return 'Roof'
    return `Floor ${floor}`
  }

  return (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        backgroundColor: 'background.paper',
        opacity: 0.95,
        p: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
        <LayersIcon fontSize="small" color="primary" />
        <Typography variant="body2">Floors:</Typography>
      </Box>

      <ToggleButtonGroup
        value={selectedFloors}
        onChange={handleChange}
        aria-label="floor selection"
        size="small"
      >
        {floors.map((floor) => (
          <ToggleButton
            key={floor}
            value={floor}
            aria-label={getFloorLabel(floor)}
            sx={{
              px: 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            }}
          >
            {getFloorLabel(floor)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Paper>
  )
}

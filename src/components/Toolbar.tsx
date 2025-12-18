import { useRef } from 'react'
import {
  AppBar,
  Toolbar as MuiToolbar,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import InfoIcon from '@mui/icons-material/Info'

interface ToolbarProps {
  onLoadIFC: (file: File) => void
  onLoadGLTF: (file: File) => void
  onToggleProperties: () => void
  isLoading: boolean
  loadingProgress: number
  propertiesPanelOpen: boolean
}

export function Toolbar({
  onLoadIFC,
  onLoadGLTF,
  onToggleProperties,
  isLoading,
  loadingProgress,
  propertiesPanelOpen,
}: ToolbarProps) {
  const ifcInputRef = useRef<HTMLInputElement>(null)
  const gltfInputRef = useRef<HTMLInputElement>(null)

  const handleIFCChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onLoadIFC(file)
      event.target.value = ''
    }
  }

  const handleGLTFChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onLoadGLTF(file)
      event.target.value = ''
    }
  }

  return (
    <AppBar position="static" color="default" elevation={1}>
      <MuiToolbar>
        <ViewInArIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          BIM Viewer
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          <input
            type="file"
            accept=".ifc"
            ref={ifcInputRef}
            style={{ display: 'none' }}
            onChange={handleIFCChange}
          />
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={() => ifcInputRef.current?.click()}
            disabled={isLoading}
          >
            Load IFC
          </Button>

          <input
            type="file"
            accept=".gltf,.glb"
            ref={gltfInputRef}
            style={{ display: 'none' }}
            onChange={handleGLTFChange}
          />
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => gltfInputRef.current?.click()}
            disabled={isLoading}
          >
            Load glTF/GLB
          </Button>

          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2">
                Loading... {loadingProgress.toFixed(0)}%
              </Typography>
            </Box>
          )}
        </Box>

        <Tooltip title="Toggle Properties Panel">
          <IconButton
            color={propertiesPanelOpen ? 'primary' : 'default'}
            onClick={onToggleProperties}
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </MuiToolbar>
    </AppBar>
  )
}

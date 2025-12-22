import { useRef, useState } from 'react'
import {
  AppBar,
  Toolbar as MuiToolbar,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import InfoIcon from '@mui/icons-material/Info'
import HomeIcon from '@mui/icons-material/Home'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

export type SampleType = 'house' | 'building'

interface ToolbarProps {
  onLoadIFC: (file: File) => void
  onLoadGLTF: (file: File) => void
  onLoadSample: (type: SampleType) => void
  onRvtDetected: (fileName: string) => void
  onToggleProperties: () => void
  isLoading: boolean
  loadingProgress: number
  propertiesPanelOpen: boolean
  loadedSamples: SampleType[]
}

export function Toolbar({
  onLoadIFC,
  onLoadGLTF,
  onLoadSample,
  onRvtDetected,
  onToggleProperties,
  isLoading,
  loadingProgress,
  propertiesPanelOpen,
  loadedSamples,
}: ToolbarProps) {
  const ifcInputRef = useRef<HTMLInputElement>(null)
  const gltfInputRef = useRef<HTMLInputElement>(null)
  const rvtInputRef = useRef<HTMLInputElement>(null)
  const [sampleMenuAnchor, setSampleMenuAnchor] = useState<null | HTMLElement>(null)

  const handleSampleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSampleMenuAnchor(event.currentTarget)
  }

  const handleSampleMenuClose = () => {
    setSampleMenuAnchor(null)
  }

  const handleSampleSelect = (type: SampleType) => {
    onLoadSample(type)
    handleSampleMenuClose()
  }

  const allSamplesLoaded = loadedSamples.includes('house') && loadedSamples.includes('building')

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

  const handleRvtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onRvtDetected(file.name)
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

        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, alignItems: 'center' }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<HomeIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={handleSampleMenuOpen}
            disabled={isLoading || allSamplesLoaded}
          >
            Load Sample
          </Button>
          <Menu
            anchorEl={sampleMenuAnchor}
            open={Boolean(sampleMenuAnchor)}
            onClose={handleSampleMenuClose}
          >
            <MenuItem
              onClick={() => handleSampleSelect('house')}
              disabled={loadedSamples.includes('house')}
            >
              <ListItemIcon>
                <HomeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sample House</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => handleSampleSelect('building')}
              disabled={loadedSamples.includes('building')}
            >
              <ListItemIcon>
                <ApartmentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sample Building (IFC)</ListItemText>
            </MenuItem>
          </Menu>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

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

          <input
            type="file"
            accept=".rvt"
            ref={rvtInputRef}
            style={{ display: 'none' }}
            onChange={handleRvtChange}
          />
          <Button
            variant="outlined"
            color="warning"
            startIcon={<UploadFileIcon />}
            onClick={() => rvtInputRef.current?.click()}
            disabled={isLoading}
          >
            Load RVT
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

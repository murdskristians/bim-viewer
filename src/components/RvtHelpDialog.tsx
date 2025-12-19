import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider,
} from '@mui/material'
import {
  Warning as WarningIcon,
  OpenInNew as OpenInNewIcon,
  LooksOne as OneIcon,
  LooksTwo as TwoIcon,
  Looks3 as ThreeIcon,
  Looks4 as FourIcon,
} from '@mui/icons-material'
import { useState } from 'react'

interface RvtHelpDialogProps {
  open: boolean
  onClose: () => void
  fileName?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

export function RvtHelpDialog({ open, onClose, fileName }: RvtHelpDialogProps) {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Revit File Detected
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {fileName ? (
            <>
              The file <strong>{fileName}</strong> is a Revit (.rvt) file.
            </>
          ) : (
            'You selected a Revit (.rvt) file.'
          )}
          {' '}This format cannot be viewed directly in a web browser due to its proprietary nature.
        </Alert>

        <Typography variant="body1" gutterBottom>
          To view your Revit model, please convert it to one of the supported formats below:
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Convert to IFC (Recommended)" />
            <Tab label="Convert to glTF" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Option A: Free Online Converter (No Login Required)
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><OneIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Visit Convert.Guru RVT Converter"
                secondary={
                  <Link
                    href="https://convert.guru/rvt-converter"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    convert.guru/rvt-converter <OpenInNewIcon fontSize="small" />
                  </Link>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><TwoIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Upload your .rvt file (no registration needed)" />
            </ListItem>
            <ListItem>
              <ListItemIcon><ThreeIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Select IFC as output format and convert" />
            </ListItem>
            <ListItem>
              <ListItemIcon><FourIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Download and upload the .ifc file to this viewer" />
            </ListItem>
          </List>

          <Alert severity="success" sx={{ my: 2 }}>
            <strong>Alternative converters (no login):</strong>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <li>
                <Link href="https://cadbimconverter.com/" target="_blank" rel="noopener noreferrer">
                  CADBIMconverter.com
                </Link>
              </li>
              <li>
                <Link href="https://datadrivenconstruction.io/convertors/" target="_blank" rel="noopener noreferrer">
                  DataDrivenConstruction.io
                </Link>
              </li>
            </Box>
          </Alert>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Option B: Export from Revit Directly
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            If you have Autodesk Revit installed:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><OneIcon color="primary" /></ListItemIcon>
              <ListItemText primary='Open your project in Revit' />
            </ListItem>
            <ListItem>
              <ListItemIcon><TwoIcon color="primary" /></ListItemIcon>
              <ListItemText primary='Go to File → Export → IFC' />
            </ListItem>
            <ListItem>
              <ListItemIcon><ThreeIcon color="primary" /></ListItemIcon>
              <ListItemText primary='Choose IFC4 format for best compatibility' />
            </ListItem>
            <ListItem>
              <ListItemIcon><FourIcon color="primary" /></ListItemIcon>
              <ListItemText primary='Upload the exported .ifc file to this viewer' />
            </ListItem>
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Option A: Free Online Converter (No Login Required)
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><OneIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Visit Convert.Guru RVT Converter"
                secondary={
                  <Link
                    href="https://convert.guru/rvt-converter"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    convert.guru/rvt-converter <OpenInNewIcon fontSize="small" />
                  </Link>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><TwoIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Upload your .rvt file (no registration needed)" />
            </ListItem>
            <ListItem>
              <ListItemIcon><ThreeIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Select FBX or SKP as output, then convert to glTF" />
            </ListItem>
            <ListItem>
              <ListItemIcon><FourIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Upload the converted file to this viewer" />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Option B: Export from Revit with Plugin
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            If you have Autodesk Revit installed, use a glTF exporter plugin:
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon><OneIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Install a glTF exporter plugin for Revit"
                secondary={
                  <Link
                    href="https://apps.autodesk.com/RVT/en/Detail/Index?id=5525941169427298567"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    ProtoTech glTF Exporter (Autodesk App Store) <OpenInNewIcon fontSize="small" />
                  </Link>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><TwoIcon color="primary" /></ListItemIcon>
              <ListItemText primary='Open your project in Revit' />
            </ListItem>
            <ListItem>
              <ListItemIcon><ThreeIcon color="primary" /></ListItemIcon>
              <ListItemText primary='Use the plugin to export as .glb or .gltf' />
            </ListItem>
            <ListItem>
              <ListItemIcon><FourIcon color="primary" /></ListItemIcon>
              <ListItemText primary='Upload the exported file to this viewer' />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Tip:</strong> glTF/GLB files are smaller and load faster, but may contain less BIM metadata than IFC files.
          </Alert>
        </TabPanel>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Supported formats in this viewer:
          </Typography>
          <Typography variant="body2">
            <strong>IFC</strong> (.ifc) - Industry Foundation Classes, full BIM data support
          </Typography>
          <Typography variant="body2">
            <strong>glTF/GLB</strong> (.gltf, .glb) - Lightweight 3D format, fast loading
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  )
}

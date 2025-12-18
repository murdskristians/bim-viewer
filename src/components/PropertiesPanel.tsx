import {
  Box,
  Drawer,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { ElementProperties } from '../types/bim'

const DRAWER_WIDTH = 360

interface PropertiesPanelProps {
  open: boolean
  element: ElementProperties | null
  onClose: () => void
}

export function PropertiesPanel({ open, element, onClose }: PropertiesPanelProps) {
  const renderPropertyValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const groupedProperties = element
    ? Object.entries(element.properties).reduce(
        (acc, [key, value]) => {
          if (key.startsWith('Is') || key.startsWith('Has')) {
            acc.flags.push([key, value])
          } else if (typeof value === 'object') {
            acc.complex.push([key, value])
          } else {
            acc.basic.push([key, value])
          }
          return acc
        },
        { basic: [], flags: [], complex: [] } as Record<string, [string, unknown][]>
      )
    : null

  return (
    <Drawer
      anchor="right"
      open={open}
      variant="persistent"
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Element Properties</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {element ? (
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          {/* Header Info */}
          <Box sx={{ p: 2 }}>
            <Chip
              label={element.type}
              color="primary"
              size="small"
              sx={{ mb: 1 }}
            />
            {element.name && (
              <Typography variant="subtitle1" fontWeight="bold">
                {element.name}
              </Typography>
            )}
            {element.description && (
              <Typography variant="body2" color="text.secondary">
                {element.description}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Express ID: {element.expressID}
            </Typography>
            {element.globalId && (
              <Typography variant="caption" color="text.secondary" display="block">
                Global ID: {element.globalId}
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Basic Properties */}
          {groupedProperties && groupedProperties.basic.length > 0 && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Basic Properties</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List dense>
                  {groupedProperties.basic.map(([key, value]) => (
                    <ListItem key={key}>
                      <ListItemText
                        primary={key}
                        secondary={renderPropertyValue(value)}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Flags */}
          {groupedProperties && groupedProperties.flags.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Flags</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List dense>
                  {groupedProperties.flags.map(([key, value]) => (
                    <ListItem key={key}>
                      <ListItemText
                        primary={key}
                        secondary={renderPropertyValue(value)}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Complex Properties */}
          {groupedProperties && groupedProperties.complex.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Extended Properties</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  component="pre"
                  sx={{
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    backgroundColor: 'background.default',
                    p: 1,
                    borderRadius: 1,
                    maxHeight: 300,
                  }}
                >
                  {JSON.stringify(
                    Object.fromEntries(groupedProperties.complex),
                    null,
                    2
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Click on an element in the model to view its properties
          </Typography>
        </Box>
      )}
    </Drawer>
  )
}

import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Checkbox,
  Typography,
  Paper,
  Collapse,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ViewInArIcon from '@mui/icons-material/ViewInAr'
import { useState } from 'react'
import type { LoadedModel } from '../types/bim'

interface ModelListProps {
  models: LoadedModel[]
  onToggleVisibility: (modelId: string) => void
  onRemove: (modelId: string) => void
}

export function ModelList({ models, onToggleVisibility, onRemove }: ModelListProps) {
  const [expanded, setExpanded] = useState(true)

  if (models.length === 0) return null

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 80,
        left: 16,
        width: 280,
        zIndex: 100,
        backgroundColor: 'background.paper',
        opacity: 0.95,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          pl: 2,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle2">Loaded Models ({models.length})</Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <List dense sx={{ pt: 0 }}>
          {models.map((model) => (
            <ListItem
              key={model.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => onRemove(model.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox
                  edge="start"
                  checked={model.visible}
                  onChange={() => onToggleVisibility(model.id)}
                  size="small"
                />
              </ListItemIcon>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ViewInArIcon
                  fontSize="small"
                  color={model.type === 'ifc' ? 'primary' : 'secondary'}
                />
              </ListItemIcon>
              <ListItemText
                primary={model.name}
                secondary={model.type.toUpperCase()}
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Paper>
  )
}

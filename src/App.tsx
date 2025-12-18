import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme/theme'
import { Viewer } from './components'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Viewer />
    </ThemeProvider>
  )
}

export default App

import TaskList from './components/TaskList';
import { useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LinearProgress from '@mui/material/LinearProgress';
import { CelebrationDialog } from './components/CelebrationDialog';


const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    primary: { main: mode === 'dark' ? '#1976d2' : '#1565c0' },
    secondary: { main: mode === 'dark' ? '#ce93d8' : '#9c27b0' },
    background: {
      default: mode === 'dark' ? '#181c24' : '#f4f6fa',
      paper: mode === 'dark' ? '#232a36' : '#fff',
    },
    success: { main: '#43a047' },
    warning: { main: '#ffa726' },
    info: { main: '#29b6f6' },
    error: { main: '#e53935' },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [progress, setProgress] = useState<{ total: number; completed: number; percent: number }>({ total: 0, completed: 0, percent: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  useEffect(() => {
    const handler = (e: any) => {
      const d = e?.detail || {};
      const newProgress = { 
        total: d.total ?? 0, 
        completed: d.completed ?? 0, 
        percent: d.percent ?? 0 
      };
      setProgress(newProgress);
      
      // Mostrar celebración cuando se alcanza el 100%
      if (newProgress.percent === 100 && newProgress.total > 0) {
        setShowCelebration(true);
      }
    };
    window.addEventListener('tasks:progress', handler as EventListener);
    return () => window.removeEventListener('tasks:progress', handler as EventListener);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar sx={{ minHeight: 72 }}>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2, fontSize: 28 }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>Proyecto Arista</Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Tablero Kanban</Typography>
          </Box>
          <Tooltip title={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            <IconButton color="inherit" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} sx={{ ml: 1, mr: 2, width: 52, height: 52 }}>
              {mode === 'dark' ? <Brightness7Icon sx={{ fontSize: 28 }} /> : <Brightness4Icon sx={{ fontSize: 28 }} />}
            </IconButton>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 44, height: 44 }}>JI</Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: mode === 'dark' ? '#fff' : 'inherit' }}>Josue Israel Arista Huanca — Dev</Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Progress centered above tasks */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Box sx={{ width: { xs: '90%', md: 640 } }}>
          <Tooltip title={`Progreso: ${progress.percent}% (${progress.completed}/${progress.total})`}>
            <Box>
              <LinearProgress variant="determinate" value={progress.percent} sx={{ height: 12, borderRadius: 8 }} />
            </Box>
          </Tooltip>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>{progress.percent}% completado</Typography>
        </Box>
      </Box>

      <Box sx={{
        minHeight: 'calc(100vh - 64px)',
        width: '100vw',
        bgcolor: theme.palette.background.default,
        p: { xs: 1, sm: 2, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}>
        <TaskList themeMode={mode} />
      </Box>

      <CelebrationDialog 
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </ThemeProvider>
  );
}

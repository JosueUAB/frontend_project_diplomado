import { useEffect, useState } from 'react';
import axios from '../config/axios';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Grow from '@mui/material/Grow';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import EditTaskDialog from './EditTaskDialog';
import CreateTaskDialog from './CreateTaskDialog';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
// Button already imported above

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: 'Pendiente' | 'En progreso' | 'Completada' | string;
  createdAt: string;
};

const columnOrder: { key: string; title: string; }[] = [
  { key: 'Pendiente', title: 'Por hacer' },
  { key: 'En progreso', title: 'En progreso' },
  { key: 'Completada', title: 'Completadas' },
];

export default function TaskList({ themeMode }: { themeMode?: 'light' | 'dark' }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: 'Error al obtener tareas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const handler = () => fetchTasks();
    window.addEventListener('tasks:updated', handler);
    // Listen for created tasks and add them locally to avoid full refetch/reload
    const onCreated = (e: any) => {
      const created = e?.detail;
      if (!created) return;
      setTasks(prev => {
        if (prev.find(t => t._id === created._id)) return prev;
        const next = [...prev, created];
        const total = next.length;
        const completed = next.filter(t => t.status === 'Completada').length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        window.dispatchEvent(new CustomEvent('tasks:progress', { detail: { total, completed, percent } }));
        return next;
      });
    };
    window.addEventListener('tasks:created', onCreated as EventListener);
    return () => {
      window.removeEventListener('tasks:updated', handler);
      window.removeEventListener('tasks:created', onCreated as EventListener);
    };
  }, []);

  // allow AppBar to open the create dialog via a custom event
  useEffect(() => {
    const openCreate = () => setCreateOpen(true);
    window.addEventListener('open:create', openCreate as EventListener);
    return () => window.removeEventListener('open:create', openCreate as EventListener);
  }, []);

  const moveTask = async (id: string, to: string) => {
    const prev = tasks;
    const moved = prev.find(t => t._id === id);
    if (!moved) return;

    const needsConfirm = (to === 'Pendiente' && moved.status !== 'Pendiente') || (to === 'Completada' && moved.status !== 'Completada');
    if (needsConfirm) {
      setConfirm({ open: true, id, from: moved.status, to, apply: async () => {
        // perform the actual move
        const prevState = tasks;
        const newTasks = prevState.map(t => t._id === id ? { ...t, status: to } : t);
        setTasks(newTasks);
        setSnack({ open: true, message: 'Moviendo...', severity: 'info' });
        try {
          await axios.put(`/tasks/${id}`, { status: to });
          setSnack({ open: true, message: getStatusMessage(to), severity: 'success' });
          const total = newTasks.length;
          const completed = newTasks.filter(t => t.status === 'Completada').length;
          const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
          window.dispatchEvent(new CustomEvent('tasks:progress', { detail: { total, completed, percent } }));
        } catch (err: any) {
          setTasks(prevState);
          setSnack({ open: true, message: err?.response?.data?.message || 'Error al actualizar', severity: 'error' });
        }
      }});
      return;
    }

    // No confirmation needed -> perform immediately
    const prevState = tasks;
    const newTasks = prevState.map(t => t._id === id ? { ...t, status: to } : t);
    setTasks(newTasks);
    setSnack({ open: true, message: 'Moviendo...', severity: 'info' });
    try {
      await axios.put(`/tasks/${id}`, { status: to });
      setSnack({ open: true, message: getStatusMessage(to), severity: 'success' });
      const total = newTasks.length;
      const completed = newTasks.filter(t => t.status === 'Completada').length;
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      window.dispatchEvent(new CustomEvent('tasks:progress', { detail: { total, completed, percent } }));
    } catch (err: any) {
      setTasks(prevState);
      setSnack({ open: true, message: err?.response?.data?.message || 'Error al actualizar', severity: 'error' });
    }
  };

  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; from?: string; to?: string; apply?: (() => Promise<void>) } | null>(null);

  const handleConfirmClose = () => setConfirm(null);
  // Show snackbar when user cancels confirmation
  const handleConfirmCancel = () => {
    setConfirm(null);
    setSnack({ open: true, message: 'Movimiento cancelado', severity: 'info' });
  };

  const handleConfirmAccept = async () => {
    if (confirm?.apply) {
      await confirm.apply();
    }
    setConfirm(null);
  };

  const getStatusMessage = (status: string) => {
    if (status === 'Pendiente') return 'Tarea por hacer';
    if (status === 'En progreso') return 'Tarea en progreso';
    if (status === 'Completada') return 'Tarea completada';
    return 'Estado actualizado';
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    // If dropped in same place, do nothing
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const movedTask = tasks.find(t => t._id === draggableId);
    if (!movedTask) return;

    const newStatus = destination.droppableId;
    const newPosition = destination.index;

    // prepare optimistic reorder locally
    const prev = tasks;
    const without = prev.filter(t => t._id !== movedTask._id);
    const updatedMoved = { ...movedTask, status: newStatus, position: newPosition };
    const newTasksList: Task[] = [];
    for (const col of columnOrder) {
      if (col.key === newStatus) {
        const before = without.filter(t => t.status === col.key);
        const inserted = [...before.slice(0, newPosition), updatedMoved, ...before.slice(newPosition)];
        newTasksList.push(...inserted);
      } else {
        newTasksList.push(...without.filter(t => t.status === col.key));
      }
    }

    const needsConfirm = (newStatus === 'Pendiente' && movedTask.status !== 'Pendiente') || (newStatus === 'Completada' && movedTask.status !== 'Completada');
    if (needsConfirm) {
      // Ask confirmation before applying drag move
      setConfirm({ open: true, id: movedTask._id, from: movedTask.status, to: newStatus, apply: async () => {
        const prevState = tasks;
        setTasks(newTasksList);
        setSnack({ open: true, message: 'Moviendo...', severity: 'info' });
        try {
          await axios.put(`/tasks/${movedTask._id}`, { status: newStatus, position: newPosition });
          setSnack({ open: true, message: getStatusMessage(newStatus), severity: 'success' });
          const total = newTasksList.length;
          const completed = newTasksList.filter(t => t.status === 'Completada').length;
          const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
          window.dispatchEvent(new CustomEvent('tasks:progress', { detail: { total, completed, percent } }));
        } catch (err: any) {
          setTasks(prevState);
          setSnack({ open: true, message: err?.response?.data?.message || 'No se pudo mover', severity: 'error' });
        }
      }});
      return;
    }

    // No confirmation needed -> perform optimistic update immediately
    setTasks(newTasksList);
    setSnack({ open: true, message: 'Moviendo...', severity: 'info' });
    try {
      await axios.put(`/tasks/${movedTask._id}`, { status: newStatus, position: newPosition });
      setSnack({ open: true, message: getStatusMessage(newStatus), severity: 'success' });
      const total = newTasksList.length;
      const completed = newTasksList.filter(t => t.status === 'Completada').length;
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      window.dispatchEvent(new CustomEvent('tasks:progress', { detail: { total, completed, percent } }));
    } catch (err: any) {
      setTasks(prev);
      setSnack({ open: true, message: err?.response?.data?.message || 'No se pudo mover', severity: 'error' });
    }
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setDialogOpen(true);
  };

  const onSaved = (updated: any) => {
    // refresh list
    fetchTasks();
  };

  const [createOpen, setCreateOpen] = useState(false);

  if (loading) {
    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {columnOrder.map((col) => (
          <Grid item xs={12} md={4} key={col.key}>
            <Paper sx={{ p: 2, minHeight: 200 }}>
              <Typography variant="h6">{col.title}</Typography>
              <Skeleton variant="rectangular" height={140} sx={{ mt: 2 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Colores de fondo por estado
  // Mejores colores para modo claro
  const cardColors: Record<string, string> = {
    'Pendiente': themeMode === 'dark' ? '#263238' : '#fff8e1',
    'En progreso': themeMode === 'dark' ? '#1e88e5' : '#e3f2fd',
    'Completada': themeMode === 'dark' ? '#388e3c' : '#e8f5e9',
  };
  const cardText: Record<string, string> = {
    'Pendiente': themeMode === 'dark' ? '#fffde7' : '#b26a00',
    'En progreso': themeMode === 'dark' ? '#fff' : '#0d47a1',
    'Completada': themeMode === 'dark' ? '#fff' : '#1b5e20',
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        color="secondary"
        size="large"
        sx={{ mb: 3, borderRadius: 8, fontWeight: 700, boxShadow: 3, fontSize: 20, px: 4 }}
        onClick={() => setCreateOpen(true)}
        startIcon={<span style={{ fontSize: 28, fontWeight: 900 }}>+</span>}
        title="Crear una nueva tarea"
      >
        Nueva tarea
      </Button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={2}>
          {columnOrder.map((col) => {
            const columnTasks = tasks.filter(t => t.status === col.key).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            return (
              <Grid item xs={12} md={4} key={col.key}>
                <Paper sx={{ p: 2, minHeight: 220, bgcolor: themeMode === 'dark' ? '#232a36' : '#fafafa', transition: 'background 0.3s', boxShadow: 6 }} elevation={4}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: 22, md: 26 } }}>{col.title} <Chip label={columnTasks.length} size="medium" sx={{ ml: 1, fontSize: 18 }} /></Typography>

                  <Droppable droppableId={col.key}>
                    {(provided) => (
                      <Box ref={provided.innerRef} {...provided.droppableProps}>
                        <Stack spacing={1}>
                          {columnTasks.length === 0 && (
                            <Typography variant="body2" color="text.secondary">No hay tareas</Typography>
                          )}

                          {columnTasks.map((t, i) => (
                            <Draggable draggableId={t._id} index={i} key={t._id}>
                              {(dragProvided) => (
                                <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                                  <Grow in={true} timeout={300 + i * 80}>
                                    <Paper
                                      sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        boxShadow: 8,
                                        bgcolor: cardColors[t.status] || (themeMode === 'dark' ? '#232a36' : '#fff'),
                                        color: cardText[t.status] || 'inherit',
                                        borderLeft: `8px solid ${t.status === 'Pendiente' ? '#ffa726' : t.status === 'En progreso' ? '#1976d2' : '#43a047'}`,
                                        transition: 'background 0.3s, color 0.3s',
                                        position: 'relative',
                                        overflow: 'visible',
                                        fontSize: 18,
                                      }}
                                    >
                                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box sx={{ width: '100%' }}>
                                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: 18, md: 22 } }}>{t.title}</Typography>
                                          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: 15, md: 17 } }}>{t.description}</Typography>
                                          <Typography variant="caption" display="block" sx={{ mt: 1, fontSize: 14 }}>{new Date(t.createdAt).toLocaleString()}</Typography>
                                          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                            {(t.labels || []).map((l, idx) => (
                                              <Chip key={idx} label={l.name} size="medium" sx={{ backgroundColor: l.color || (themeMode === 'dark' ? '#37474f' : '#e0e0e0'), color: l.color ? '#fff' : undefined, fontSize: 15, fontWeight: 600 }} />
                                            ))}
                                            <Chip label={t.status} size="medium" sx={{ backgroundColor: t.status === 'Pendiente' ? '#ffa726' : t.status === 'En progreso' ? '#1976d2' : '#43a047', color: '#fff', fontWeight: 700, fontSize: 15 }} />
                                          </Stack>
                                        </Box>
                                        <Box sx={{ ml: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                          <Tooltip title="Editar tarea">
                                            <IconButton size="large" aria-label="Editar tarea" onClick={() => openEdit(t)} sx={{ color: themeMode === 'dark' ? '#fff' : undefined }}>
                                              <MoreHorizIcon fontSize="large" />
                                            </IconButton>
                                          </Tooltip>
                                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {col.key !== 'Pendiente' && (() => {
                                              const to = col.key === 'En progreso' ? 'Pendiente' : 'En progreso';
                                              const label = to === 'Pendiente' ? 'Por hacer' : to;
                                              return (
                                                <Tooltip title={`Mover a ${label}`} key={`back-${t._id}`}>
                                                  <IconButton
                                                    size="large"
                                                    onClick={() => moveTask(t._id, to)}
                                                    sx={{
                                                      bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                                      color: themeMode === 'dark' ? '#fff' : undefined,
                                                      '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                                                    }}
                                                  >
                                                    <ArrowBackIcon fontSize="large" />
                                                  </IconButton>
                                                </Tooltip>
                                              );
                                            })()}
                                            {col.key !== 'Completada' && (() => {
                                              const to = col.key === 'Pendiente' ? 'En progreso' : 'Completada';
                                              const label = to === 'Completada' ? 'Completada' : to === 'En progreso' ? 'En progreso' : 'Por hacer';
                                              return (
                                                <Tooltip title={`Mover a ${label}`} key={`forward-${t._id}`}>
                                                  <IconButton
                                                    size="large"
                                                    onClick={() => moveTask(t._id, to)}
                                                    sx={{
                                                      bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                                      color: themeMode === 'dark' ? '#fff' : undefined,
                                                      '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                                                    }}
                                                  >
                                                    <ArrowForwardIcon fontSize="large" />
                                                  </IconButton>
                                                </Tooltip>
                                              );
                                            })()}
                                          </Box>
                                        </Box>
                                      </Stack>
                                    </Paper>
                                  </Grow>
                                </div>
                              )}
                            </Draggable>
                          ))}
                                {provided.placeholder}
                        </Stack>
                      </Box>
                    )}
                  </Droppable>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DragDropContext>

            <EditTaskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} task={editing} onSaved={onSaved} />
            <CreateTaskDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchTasks} />

            <Dialog open={!!confirm?.open} onClose={handleConfirmClose}>
              <DialogTitle>Confirmar movimiento</DialogTitle>
              <DialogContent>
                <Typography sx={{ mb: 1 }}>La tarea está actualmente en <strong>{confirm?.from}</strong>.</Typography>
                <Typography>¿Estás seguro de moverla a <strong>{confirm?.to}</strong>?</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleConfirmCancel} color="inherit">Cancelar</Button>
                <Button onClick={handleConfirmAccept} variant="contained" color="primary">Confirmar</Button>
              </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
              <MuiAlert elevation={6} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
                {snack.message}
              </MuiAlert>
            </Snackbar>
    </Box>
  );
}

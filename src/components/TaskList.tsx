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
import Modal from '@mui/material/Modal';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: 'Pendiente' | 'En progreso' | 'Completada' | string;
  createdAt: string;
  labels?: { name: string; color?: string }[];
  position?: number;
};

const columnOrder: { key: string; title: string; }[] = [
  { key: 'Pendiente', title: 'Por hacer' },
  { key: 'En progreso', title: 'En progreso' },
  { key: 'Completada', title: 'Completadas' },
];

// Modal para mostrar detalles completos de la tarea
const TaskDetailModal = ({ task, open, onClose, themeMode }: { 
  task: Task | null; 
  open: boolean; 
  onClose: () => void;
  themeMode?: 'light' | 'dark';
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Card sx={{ 
        maxWidth: 500, 
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        bgcolor: themeMode === 'dark' ? '#2d3748' : '#fff'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: themeMode === 'dark' ? '#fff' : '#000' }}>
              {task?.title}
            </Typography>
            <IconButton onClick={onClose} sx={{ color: themeMode === 'dark' ? '#fff' : '#000' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Typography variant="body1" sx={{ mb: 2, color: themeMode === 'dark' ? '#e2e8f0' : '#4a5568' }}>
            {task?.description || 'Sin descripción'}
          </Typography>
          
          <Typography variant="caption" display="block" sx={{ mb: 2, color: themeMode === 'dark' ? '#a0aec0' : '#718096' }}>
            Creado: {task?.createdAt ? new Date(task.createdAt).toLocaleString() : ''}
          </Typography>
          
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {(task?.labels || []).map((l, idx) => (
              <Chip 
                key={idx} 
                label={l.name} 
                size="medium" 
                sx={{ 
                  backgroundColor: l.color || (themeMode === 'dark' ? '#4a5568' : '#e2e8f0'), 
                  color: l.color ? '#fff' : (themeMode === 'dark' ? '#fff' : '#000'),
                  fontWeight: 600 
                }} 
              />
            ))}
            <Chip 
              label={task?.status} 
              size="medium" 
              sx={{ 
                backgroundColor: 
                  task?.status === 'Pendiente' ? '#ffa726' : 
                  task?.status === 'En progreso' ? '#1976d2' : '#43a047', 
                color: '#fff', 
                fontWeight: 700 
              }} 
            />
          </Stack>
        </CardContent>
        <DialogActions sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Card>
    </Modal>
  );
};

export default function TaskList({ themeMode }: { themeMode?: 'light' | 'dark' }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const movedTask = tasks.find(t => t._id === draggableId);
    if (!movedTask) return;

    const newStatus = destination.droppableId;
    const newPosition = destination.index;

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

  const openDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  };

  const onSaved = (updated: any) => {
    fetchTasks();
  };

  const [createOpen, setCreateOpen] = useState(false);

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Grid container spacing={3}>
          {columnOrder.map((col) => (
            <Grid item xs={12} md={4} key={col.key}>
              <Paper sx={{ p: 3, height: '600px' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{col.title}</Typography>
                <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

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
    <Box sx={{ width: '100%', mt: 2 }}>
      <Button
        variant="contained"
        color="secondary"
        size="large"
        sx={{ 
          mb: 4, 
          borderRadius: 3, 
          fontWeight: 700, 
          boxShadow: 3, 
          fontSize: 16, 
          px: 4,
          py: 1.5
        }}
        onClick={() => setCreateOpen(true)}
        startIcon={<span style={{ fontSize: 20, fontWeight: 900 }}>+</span>}
        title="Crear una nueva tarea"
      >
        Nueva tarea
      </Button>

      <DragDropContext onDragEnd={onDragEnd}>
       <Grid container spacing={3} sx={{ minHeight: '70vh', display: 'flex', flexWrap: 'wrap' }}>
  {columnOrder.map((col) => {
    const columnTasks = tasks.filter(t => t.status === col.key).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return (
      <Grid 
        item 
        xs={12}   // 100% de ancho en pantallas pequeñas
        sm={6}    // 50% de ancho en pantallas medianas
        md={4}    // 33% de ancho en pantallas grandes
        key={col.key}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
       
                <Paper 
                  sx={{ 
                    p: 3, 
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: themeMode === 'dark' ? '#1a202c' : '#f7fafc', 
                    transition: 'all 0.3s ease',
                    boxShadow: 2,
                    borderRadius: 3,
                    height: '100%',
                    minHeight: '600px',
                    minWidth: '120px'
                  }} 
                >
                  {/* Header de la columna */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 3,
                    pb: 2,
                    borderBottom: `2px solid ${themeMode === 'dark' ? '#2d3748' : '#e2e8f0'}`
                  }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: 20,
                        color: themeMode === 'dark' ? '#fff' : '#2d3748'
                      }}
                    >
                      {col.title}
                    </Typography>
                    <Chip 
                      label={columnTasks.length} 
                      size="medium" 
                      sx={{ 
                        fontSize: 14,
                        fontWeight: 700,
                        bgcolor: themeMode === 'dark' ? '#4a5568' : '#e2e8f0',
                        color: themeMode === 'dark' ? '#fff' : '#4a5568'
                      }} 
                    />
                  </Box>

                  {/* Área de tareas */}
                  <Droppable droppableId={col.key}>
                    {(provided) => (
                      <Box 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        sx={{ 
                          flexGrow: 1,
                          overflow: 'auto',
                          maxHeight: 'calc(100% - 80px)'
                        }}
                      >
                        <Stack spacing={2}>
                          {columnTasks.length === 0 && (
                            <Box 
                              sx={{ 
                                textAlign: 'center', 
                                py: 8,
                                color: themeMode === 'dark' ? '#a0aec0' : '#718096'
                              }}
                            >
                              <Typography variant="body2">
                                No hay tareas en esta columna
                              </Typography>
                            </Box>
                          )}

                          {columnTasks.map((t, i) => (
                            <Draggable draggableId={t._id} index={i} key={t._id}>
                              {(dragProvided) => (
                                <Box
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                >
                                  <Grow in={true} timeout={300 + i * 80}>
                                    <Paper
                                      sx={{
                                        p: 2.5,
                                        borderRadius: 2,
                                        boxShadow: 2,
                                        bgcolor: cardColors[t.status] || (themeMode === 'dark' ? '#2d3748' : '#fff'),
                                        color: cardText[t.status] || 'inherit',
                                        borderLeft: `4px solid ${
                                          t.status === 'Pendiente' ? '#ffa726' : 
                                          t.status === 'En progreso' ? '#1976d2' : '#43a047'
                                        }`,
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        minHeight: '140px',
                                         minWidth: '120px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        '&:hover': {
                                          boxShadow: 4,
                                          transform: 'translateY(-2px)'
                                        }
                                      }}
                                    >
                                      {/* Contenido principal */}
                                      <Box sx={{ flexGrow: 1 }}>
                                        <Typography 
                                          variant="h6" 
                                          sx={{ 
                                            fontWeight: 700, 
                                            mb: 1.5, 
                                            fontSize: 16,
                                            lineHeight: 1.3,
                                            color: themeMode === 'dark' ? '#fff' : '#2d3748'
                                          }}
                                        >
                                          {t.title}
                                        </Typography>
                                        
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            fontSize: 12,
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            mb: 2,
                                            lineHeight: 1.4,
                                            color: themeMode === 'dark' ? '#e2e8f0' : '#4a5568'
                                          }}
                                        >
                                          {t.description}
                                        </Typography>
                                      </Box>

                                      {/* Información inferior */}
                                      <Box>
                                        {/* Fecha y etiquetas */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                          <Typography 
                                            variant="caption" 
                                            sx={{ 
                                              fontSize: 11,
                                              color: themeMode === 'dark' ? '#a0aec0' : '#718096'
                                            }}
                                          >
                                            {new Date(t.createdAt).toLocaleDateString('es-ES', {
                                              day: 'numeric',
                                              month: 'short'
                                            })}
                                          </Typography>
                                          
                                          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-end' }}>
                                            {(t.labels || []).slice(0, 2).map((l, idx) => (
                                              <Chip 
                                                key={idx} 
                                                label={l.name} 
                                                size="small" 
                                                sx={{ 
                                                  backgroundColor: l.color || (themeMode === 'dark' ? '#4a5568' : '#e2e8f0'), 
                                                  color: l.color ? '#fff' : (themeMode === 'dark' ? '#fff' : '#4a5568'),
                                                  fontSize: 10, 
                                                  fontWeight: 600,
                                                  height: 20,
                                                  weight:20
                                                }} 
                                              />
                                            ))}
                                            {(t.labels || []).length > 2 && (
                                              <Chip 
                                                label={`+${(t.labels || []).length - 2}`} 
                                                size="small" 
                                                sx={{ 
                                                  backgroundColor: themeMode === 'dark' ? '#4a5568' : '#e2e8f0',
                                                  color: themeMode === 'dark' ? '#fff' : '#4a5568',
                                                  fontSize: 10,
                                                  height: 20,
                                                  weight:20
                                                }} 
                                              />
                                            )}
                                          </Stack>
                                        </Box>

                                        {/* Botones de acción */}
                                        <Box sx={{ 
                                          display: 'flex', 
                                          justifyContent: 'space-between', 
                                          alignItems: 'center',
                                          pt: 1,
                                          borderTop: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                                        }}>
                                          <Button 
                                            size="small" 
                                            onClick={() => openDetails(t)}
                                            sx={{ 
                                              fontSize: 12, 
                                              px: 1,
                                              minWidth: '80px'
                                            }}
                                            startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                                          >
                                            Detalles
                                          </Button>
                                          
                                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Editar tarea">
                                              <IconButton 
                                                size="small" 
                                                onClick={() => openEdit(t)} 
                                                sx={{ 
                                                  color: themeMode === 'dark' ? '#a0aec0' : '#718096',
                                                  '&:hover': {
                                                    color: themeMode === 'dark' ? '#fff' : '#2d3748',
                                                    bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                  }
                                                }}
                                              >
                                                <MoreHorizIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                            
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                              {col.key !== 'Pendiente' && (
                                                <Tooltip title="Mover atrás">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => moveTask(t._id, col.key === 'En progreso' ? 'Pendiente' : 'En progreso')}
                                                    sx={{
                                                      color: themeMode === 'dark' ? '#a0aec0' : '#718096',
                                                      '&:hover': {
                                                        color: themeMode === 'dark' ? '#fff' : '#2d3748',
                                                        bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                      }
                                                    }}
                                                  >
                                                    <ArrowBackIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                              
                                              {col.key !== 'Completada' && (
                                                <Tooltip title="Mover adelante">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => moveTask(t._id, col.key === 'Pendiente' ? 'En progreso' : 'Completada')}
                                                    sx={{
                                                      color: themeMode === 'dark' ? '#a0aec0' : '#718096',
                                                      '&:hover': {
                                                        color: themeMode === 'dark' ? '#fff' : '#2d3748',
                                                        bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                      }
                                                    }}
                                                  >
                                                    <ArrowForwardIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                            </Box>
                                          </Box>
                                        </Box>
                                      </Box>
                                    </Paper>
                                  </Grow>
                                </Box>
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

      <TaskDetailModal 
        task={selectedTask} 
        open={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)}
        themeMode={themeMode}
      />

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

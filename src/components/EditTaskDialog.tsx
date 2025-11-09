import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from '../config/axios';
import Swal from 'sweetalert2';

type Label = { name: string; color?: string };

type Task = {
  _id: string;
  title: string;
  description?: string;
  labels?: Label[];
  status?: string;
};

export default function EditTaskDialog({ open, onClose, task, onSaved }: { open: boolean; onClose: () => void; task?: Task | null; onSaved?: (updated: any) => void; }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // labels removed from edit dialog per UX request

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      // labels intentionally not set/displayed
    } else {
      setTitle('');
      setDescription('');
      // no labels
    }
  }, [task]);


  const save = async () => {
    if (!task) return;
    try {
      const res = await axios.put(`/tasks/${task._id}`, { title, description });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tarea actualizada', timer: 1200, showConfirmButton: false });
      onSaved && onSaved(res.data);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar tarea</DialogTitle>
      <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Título" value={title} onChange={e => setTitle(e.target.value)} fullWidth />
          <TextField label="Descripción" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={3} />
          {/* etiquetas ocultas por petición del usuario */}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={save}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

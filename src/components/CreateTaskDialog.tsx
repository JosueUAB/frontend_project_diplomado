import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import Swal from 'sweetalert2';
import axios from '../config/axios';

type Label = { name: string; color?: string };

export default function CreateTaskDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // labels removed per UX request
  const [loading, setLoading] = useState(false);

  // tag functions removed

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      Swal.fire({ icon: 'warning', title: 'El título es obligatorio' });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/tasks', { title, description });
      const created = res.data;
      setTitle('');
      setDescription('');
      // Notify TaskList to add the task locally without full refetch
      window.dispatchEvent(new CustomEvent('tasks:created', { detail: created }));
      onClose();
      Swal.fire({ icon: 'success', title: 'Tarea creada', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      const details = err?.response?.data?.details || err?.response?.data?.message || 'Error';
      Swal.fire({ icon: 'error', title: 'Error', html: Array.isArray(details) ? details.map((d: any) => `${d.field}: ${d.message}`).join('<br/>') : String(details) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Nueva tarea</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Título" value={title} onChange={e => setTitle(e.target.value)} fullWidth required autoFocus />
            <TextField label="Descripción" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={3} />
            {/* etiquetas deshabilitadas por petición del usuario */}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading}>Crear</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

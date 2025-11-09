import { useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import SendIcon from '@mui/icons-material/Send';
import Swal from 'sweetalert2';

export default function CreateTask() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/tasks', { title, description });
      const created = res.data;
      setTitle('');
      setDescription('');
      // Notify listeners with the created task so TaskList can update locally without full refetch
      window.dispatchEvent(new CustomEvent('tasks:created', { detail: created }));
      Swal.fire({
        icon: 'success',
        title: 'Tarea creada',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      const details = err?.response?.data?.details || err?.response?.data?.message || 'Error';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        html: Array.isArray(details) ? details.map((d: any) => `${d.field}: ${d.message}`).join('<br/>') : String(details),
      });
    }
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ mb: 2 }}>
      <Stack spacing={1}>
        <TextField label="Título" value={title} onChange={e => setTitle(e.target.value)} fullWidth />
        <TextField label="Descripción" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={3} />
        <Button type="submit" variant="contained" endIcon={<SendIcon />}>Crear tarea</Button>
      </Stack>
    </Box>
  );
}

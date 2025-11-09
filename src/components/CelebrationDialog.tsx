import React from 'react';
import Confetti from 'react-confetti';
import { Dialog, DialogContent, Typography, Button, Box } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { keyframes } from '@emotion/react';

const bounceAnimation = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
`;

interface CelebrationDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CelebrationDialog: React.FC<CelebrationDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
          borderRadius: 4,
          padding: 2
        }
      }}
    >
      <DialogContent>
        <Confetti 
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
        
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
          color="white"
          py={4}
        >
          <EmojiEventsIcon 
            sx={{ 
              fontSize: 80,
              color: '#ffd700',
              animation: `${bounceAnimation} 2s ease infinite`,
              mb: 2
            }} 
          />
          
          <Typography variant="h4" gutterBottom fontWeight="bold">
            ¡Felicitaciones! 🎉
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Has completado todas tus tareas
          </Typography>
          
          <Typography variant="body1" sx={{ mt: 2, mb: 4 }}>
            Excelente trabajo manteniendo todo organizado y completado.
            ¡Sigue así!
          </Typography>

          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              bgcolor: 'white',
              color: '#0077b6',
              '&:hover': {
                bgcolor: '#f8f9fa'
              }
            }}
          >
            ¡Gracias!
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

import { studyPets } from '../../data/pets';

const PetSelectionModal = ({ open, onSelect }) => (
  <Dialog open={open} maxWidth="md" fullWidth>
    <DialogTitle>Select your study companion</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Pick a pet to follow you on every BrainTrails adventure. You can change it later from the hero card.
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
        {studyPets.map((pet) => (
          <Box
            key={pet.id}
            sx={{
              flex: '1 1 200px',
              border: `2px solid ${pet.colors[0]}55`,
              borderRadius: 3,
              p: 2,
              background: `linear-gradient(145deg, ${pet.colors[0]}22, ${pet.colors[1]}22)`,
              boxShadow: `0 12px 30px ${pet.colors[1]}33`,
            }}
          >
            <Typography variant="h4" mb={1}>
              {pet.emoji}
            </Typography>
            <Typography variant="h6">{pet.name}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              {pet.description}
            </Typography>
            <Button variant="contained" onClick={() => onSelect(pet.id)}>
              Choose {pet.name}
            </Button>
          </Box>
        ))}
      </Stack>
    </DialogContent>
  </Dialog>
);

export default PetSelectionModal;

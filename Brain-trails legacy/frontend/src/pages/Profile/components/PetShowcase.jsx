import { useState } from 'react';
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Favorite as HeartIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

// Pet emoji mapping
const PET_EMOJIS = {
  cat: '🐱',
  dog: '🐶',
  fox: '🦊',
  owl: '🦉',
  dragon: '🐉',
  unicorn: '🦄',
  bunny: '🐰',
  panda: '🐼',
  bear: '🐻',
  penguin: '🐧',
};

const MOOD_COLORS = {
  happy: 'success',
  neutral: 'default',
  sad: 'warning',
  excited: 'primary',
};

function PetCard({ pet, onClick, locked = false }) {
  const emoji = PET_EMOJIS[pet?.pet_type] || '❓';

  return (
    <Box
      onClick={() => !locked && onClick?.(pet)}
      sx={{
        width: 100,
        height: 110,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        bgcolor: locked ? 'action.disabledBackground' : 'background.paper',
        border: 2,
        borderColor: locked ? 'divider' : pet?.is_active ? 'primary.main' : 'divider',
        cursor: locked ? 'default' : 'pointer',
        transition: 'all 0.2s',
        opacity: locked ? 0.5 : 1,
        '&:hover': locked ? {} : {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <Typography variant="h3" sx={{ mb: 0.5 }}>
        {locked ? <LockIcon color="disabled" /> : emoji}
      </Typography>
      <Typography 
        variant="body2" 
        fontWeight="medium"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '90%',
        }}
      >
        {locked ? '???' : pet?.name}
      </Typography>
      {!locked && (
        <Typography variant="caption" color="text.secondary">
          Lvl {pet?.level || 1}
        </Typography>
      )}
      {pet?.is_active && (
        <Chip 
          label="Active" 
          size="small" 
          color="primary" 
          sx={{ mt: 0.5, height: 20, fontSize: 10 }}
        />
      )}
    </Box>
  );
}

function PetDetailDialog({ open, onClose, pet }) {
  if (!pet) return null;
  
  const emoji = PET_EMOJIS[pet.pet_type] || '❓';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Pet Details
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
          <Typography sx={{ fontSize: 80 }}>{emoji}</Typography>
          <Typography variant="h5" fontWeight="bold">
            {pet.name}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={`Level ${pet.level || 1}`} color="primary" />
            <Chip 
              label={pet.mood || 'Happy'} 
              color={MOOD_COLORS[pet.mood?.toLowerCase()] || 'default'}
              icon={<HeartIcon />}
            />
          </Stack>
          
          {/* Happiness meter */}
          <Box sx={{ width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption">Happiness</Typography>
              <Typography variant="caption">{pet.happiness || 100}%</Typography>
            </Stack>
            <Box
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.300',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${pet.happiness || 100}%`,
                  bgcolor: 
                    (pet.happiness || 100) >= 70 ? 'success.main' :
                    (pet.happiness || 100) >= 40 ? 'warning.main' : 'error.main',
                  borderRadius: 4,
                }}
              />
            </Box>
          </Box>

          {pet.created_at && (
            <Typography variant="caption" color="text.secondary">
              Adopted on {new Date(pet.created_at).toLocaleDateString()}
            </Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default function PetShowcase({ pets, loading }) {
  const [selectedPet, setSelectedPet] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePetClick = (pet) => {
    setSelectedPet(pet);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={2}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rounded" width={100} height={110} />
          ))}
        </Stack>
      </Paper>
    );
  }

  // Sort: active pet first, then by level
  const sortedPets = [...(pets || [])].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return (b.level || 1) - (a.level || 1);
  });

  // Show locked slots if user has less than 3 pets
  const showLockedSlots = sortedPets.length < 3;
  const lockedCount = showLockedSlots ? 3 - sortedPets.length : 0;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        🐾 Pet Collection
      </Typography>

      {sortedPets.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {sortedPets.map((pet) => (
            <PetCard 
              key={pet.id} 
              pet={pet} 
              onClick={handlePetClick}
            />
          ))}
          
          {/* Locked slots */}
          {Array(lockedCount).fill(0).map((_, i) => (
            <PetCard key={`locked-${i}`} locked />
          ))}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>🥚</Typography>
          <Typography variant="body2" color="text.secondary">
            No pets yet! Reach Level 5 to unlock your first pet.
          </Typography>
        </Box>
      )}

      <PetDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        pet={selectedPet}
      />
    </Paper>
  );
}

/**
 * LevelUpModal - Celebration modal when user levels up
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Stars as StarsIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Pets as PetIcon,
  Palette as ThemeIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import Confetti from 'react-confetti';

const REWARD_ICONS = {
  room: ThemeIcon,
  theme: ThemeIcon,
  pet: PetIcon,
  badge: BadgeIcon,
  pet_accessory: PetIcon,
  title: BadgeIcon,
  feature: UnlockIcon,
};

export default function LevelUpModal({ open, newLevel, rewards = [], onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          textAlign: 'center',
          overflow: 'visible',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      }}
    >
      {open && (
        <Confetti
          width={400}
          height={400}
          recycle={false}
          numberOfPieces={200}
          style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}
        />
      )}
      
      <DialogContent sx={{ pt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <StarsIcon sx={{ fontSize: 60, color: 'gold' }} />
        </Box>
        
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Level Up!
        </Typography>
        
        <Typography variant="h2" fontWeight="bold" sx={{ my: 2 }}>
          {newLevel}
        </Typography>
        
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
          Congratulations! You've reached a new level.
        </Typography>

        {rewards.length > 0 && (
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              p: 2,
              mt: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              <TrophyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              New Rewards Unlocked!
            </Typography>
            <List dense>
              {rewards.map((reward, index) => {
                const Icon = REWARD_ICONS[reward.reward_type] || UnlockIcon;
                return (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Icon sx={{ color: 'gold' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={reward.reward_data?.name || reward.reward_id}
                      secondary={
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {reward.reward_type}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
            px: 4,
          }}
        >
          Awesome!
        </Button>
      </DialogActions>
    </Dialog>
  );
}

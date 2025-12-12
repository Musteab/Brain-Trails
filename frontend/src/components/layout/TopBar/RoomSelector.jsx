/**
 * RoomSelector - Popover to select study room theme
 */
import React from 'react';
import {
  Popover,
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { roomThemes } from '../../../theme/rooms';

const rooms = Object.values(roomThemes);

export default function RoomSelector({ anchorEl, open, onClose, currentRoom, onSelectRoom }) {
  const theme = useTheme();
  
  const handleSelect = (roomId) => {
    onSelectRoom(roomId);
    onClose();
  };
  
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 2,
          minWidth: 320,
          maxWidth: 400,
          bgcolor: theme.palette.background.paper,
          backgroundImage: 'none',
          boxShadow: `0 10px 40px ${alpha(theme.palette.common.black, 0.2)}`,
        },
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Study Rooms
      </Typography>
      <Typography variant="caption" color="text.secondary" gutterBottom display="block" mb={2}>
        Choose your study environment
      </Typography>
      
      <Grid container spacing={1.5}>
        {rooms.map((room) => (
          <Grid item xs={6} key={room.id}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                border: currentRoom === room.id 
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                bgcolor: currentRoom === room.id 
                  ? alpha(theme.palette.primary.main, 0.08)
                  : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <CardActionArea onClick={() => handleSelect(room.id)}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box textAlign="center">
                    <Typography variant="h4" mb={0.5}>
                      {room.accentIcon}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {room.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.3,
                        mt: 0.5,
                      }}
                    >
                      {room.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Popover>
  );
}

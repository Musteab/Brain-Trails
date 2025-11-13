import { Box, Button, Typography } from '@mui/material';

const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <Box
    sx={{
      border: '1px dashed rgba(255,255,255,0.2)',
      borderRadius: 3,
      p: 4,
      textAlign: 'center',
    }}
  >
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" mb={2}>
        {description}
      </Typography>
    )}
    {actionLabel && onAction && (
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;

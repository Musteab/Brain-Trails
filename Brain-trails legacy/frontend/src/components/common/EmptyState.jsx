import { Box, Button, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

const EmptyState = ({ title, description, actionLabel, onAction }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        border: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}`,
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
};

export default EmptyState;

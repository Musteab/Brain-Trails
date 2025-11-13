import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingState = ({ label = 'Loading...' }) => (
  <Box display="flex" alignItems="center" justifyContent="center" minHeight={200} flexDirection="column">
    <CircularProgress color="primary" />
    <Typography variant="body2" color="text.secondary" mt={2}>
      {label}
    </Typography>
  </Box>
);

export default LoadingState;

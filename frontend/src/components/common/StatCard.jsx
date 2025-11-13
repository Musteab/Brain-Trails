import { Stack, Typography, Card, CardContent } from '@mui/material';

const StatCard = ({ label, value, icon: Icon, trend }) => (
  <Card elevation={0}>
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        {Icon && <Icon color="primary" />}
        <div>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={600}>
            {value}
          </Typography>
          {trend && (
            <Typography variant="caption" color="success.main">
              {trend}
            </Typography>
          )}
        </div>
      </Stack>
    </CardContent>
  </Card>
);

export default StatCard;

/**
 * InsightsCard - Display AI-generated study insights
 */
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Alert,
  alpha,
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  LocalFireDepartment as FireIcon,
  Quiz as QuizIcon,
  NoteAdd as NoteIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api';

// Icon mapping
const ICONS = {
  warning: WarningIcon,
  success: SuccessIcon,
  info: InfoIcon,
  schedule: ScheduleIcon,
  trending_up: TrendingUpIcon,
  trending_flat: InfoIcon,
  local_fire_department: FireIcon,
  replay: InfoIcon,
  quiz: QuizIcon,
  note_add: NoteIcon,
  emoji_events: TrophyIcon,
};

// Type colors
const TYPE_COLORS = {
  warning: 'warning',
  success: 'success',
  info: 'info',
};

export default function InsightsCard({ compact = false }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'insights'],
    queryFn: async () => {
      const res = await analyticsApi.getInsights();
      return res.data;
    },
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={150} height={32} />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="60%" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">Failed to load insights</Alert>
        </CardContent>
      </Card>
    );
  }

  const insights = data?.insights || [];

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <LightbulbIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">
              Study more to get personalized insights!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Show fewer insights in compact mode
  const displayInsights = compact ? insights.slice(0, 3) : insights;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LightbulbIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Study Insights
          </Typography>
        </Box>

        <List dense={compact} disablePadding>
          {displayInsights.map((insight, index) => {
            const Icon = ICONS[insight.icon] || InfoIcon;
            const color = TYPE_COLORS[insight.type] || 'info';
            
            return (
              <ListItem
                key={index}
                sx={{
                  bgcolor: (theme) => alpha(theme.palette[color].main, 0.08),
                  borderRadius: 1,
                  mb: 1,
                  px: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon color={color} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" fontWeight="bold">
                      {insight.title}
                    </Typography>
                  }
                  secondary={
                    !compact && (
                      <Typography variant="body2" color="text.secondary">
                        {insight.message}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            );
          })}
        </List>

        {compact && insights.length > 3 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            +{insights.length - 3} more insights
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

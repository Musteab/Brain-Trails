/**
 * StudyHeatmap - GitHub-style contribution heatmap for study activity
 */
import React, { useMemo } from 'react';
import { Box, Typography, Tooltip, useTheme, alpha } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api';

// Days of week labels
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Month labels
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Activity level colors (based on theme)
const getLevelColors = (theme) => ({
  0: alpha(theme.palette.text.primary, 0.05),
  1: alpha(theme.palette.success.main, 0.3),
  2: alpha(theme.palette.success.main, 0.5),
  3: alpha(theme.palette.success.main, 0.7),
  4: theme.palette.success.main,
});

export default function StudyHeatmap({ days = 365 }) {
  const theme = useTheme();
  const levelColors = getLevelColors(theme);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'heatmap', days],
    queryFn: async () => {
      const res = await analyticsApi.getHeatmap(days);
      return res.data;
    },
    staleTime: 60000, // 1 minute
  });

  // Generate weeks data
  const weeksData = useMemo(() => {
    if (!data?.heatmap) return [];

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    // Adjust to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeks = [];
    let currentDate = new Date(startDate);
    let currentWeek = [];

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = data.heatmap[dateStr] || { count: 0, xp: 0, level: 0 };
      
      currentWeek.push({
        date: new Date(currentDate),
        dateStr,
        ...dayData,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [data, days]);

  // Get month labels positions
  const monthLabels = useMemo(() => {
    if (weeksData.length === 0) return [];

    const labels = [];
    let lastMonth = -1;

    weeksData.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0]?.date;
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.getMonth();
        if (month !== lastMonth) {
          labels.push({ month, weekIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeksData]);

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Loading activity...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats summary */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {data?.total_days_active || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Days Active
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {data?.total_xp?.toLocaleString() || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total XP
          </Typography>
        </Box>
      </Box>

      {/* Heatmap grid */}
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'inline-block', minWidth: 'fit-content' }}>
          {/* Month labels */}
          <Box sx={{ display: 'flex', mb: 0.5, ml: '32px' }}>
            {monthLabels.map(({ month, weekIndex }) => (
              <Typography
                key={`${month}-${weekIndex}`}
                variant="caption"
                color="text.secondary"
                sx={{
                  position: 'relative',
                  left: weekIndex * 14,
                  fontSize: '10px',
                }}
              >
                {MONTHS[month]}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'flex' }}>
            {/* Day labels */}
            <Box sx={{ display: 'flex', flexDirection: 'column', mr: 0.5, width: 28 }}>
              {DAYS.map((day, i) => (
                <Typography
                  key={day}
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    height: 12,
                    lineHeight: '12px',
                    fontSize: '9px',
                    visibility: i % 2 === 1 ? 'visible' : 'hidden',
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>

            {/* Weeks grid */}
            <Box sx={{ display: 'flex', gap: '2px' }}>
              {weeksData.map((week, weekIndex) => (
                <Box key={weekIndex} sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {week.map((day) => (
                    <Tooltip
                      key={day.dateStr}
                      title={
                        <Box>
                          <Typography variant="caption" fontWeight="bold">
                            {day.date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {day.count} activities • {day.xp} XP
                          </Typography>
                        </Box>
                      }
                      placement="top"
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '2px',
                          bgcolor: levelColors[day.level],
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                          '&:hover': {
                            transform: 'scale(1.3)',
                          },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, ml: '32px' }}>
            <Typography variant="caption" color="text.secondary">
              Less
            </Typography>
            {[0, 1, 2, 3, 4].map((level) => (
              <Box
                key={level}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '2px',
                  bgcolor: levelColors[level],
                }}
              />
            ))}
            <Typography variant="caption" color="text.secondary">
              More
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

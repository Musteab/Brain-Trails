import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { LocalFireDepartment as StreakIcon } from '@mui/icons-material';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getIntensityColor(minutes, theme = 'dark') {
  if (!minutes || minutes === 0) {
    return theme === 'dark' ? '#1e1e1e' : '#ebedf0';
  }
  if (minutes < 15) return '#0e4429';
  if (minutes < 30) return '#006d32';
  if (minutes < 60) return '#26a641';
  return '#39d353';
}

function getDaysInRange(months = 12) {
  const days = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

  const current = new Date(startDate);
  while (current <= today) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export default function StudyHeatmap({ heatmapData, stats, loading }) {
  const [range, setRange] = useState(12); // months

  const { days, weeks, monthLabels } = useMemo(() => {
    const allDays = getDaysInRange(range);
    
    // Group days into weeks
    const weeksList = [];
    let currentWeek = [];
    
    for (const day of allDays) {
      currentWeek.push(day);
      if (day.getDay() === 6) { // Saturday
        weeksList.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeksList.push(currentWeek);
    }

    // Generate month labels
    const labels = [];
    let lastMonth = -1;
    weeksList.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0];
      if (firstDayOfWeek.getMonth() !== lastMonth) {
        labels.push({ month: MONTHS[firstDayOfWeek.getMonth()], weekIndex });
        lastMonth = firstDayOfWeek.getMonth();
      }
    });

    return { days: allDays, weeks: weeksList, monthLabels: labels };
  }, [range]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={130} />
      </Paper>
    );
  }

  const data = heatmapData || {};

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">📅 Study This Year</Typography>
        <ButtonGroup size="small">
          <Button 
            variant={range === 3 ? 'contained' : 'outlined'}
            onClick={() => setRange(3)}
          >
            3M
          </Button>
          <Button 
            variant={range === 6 ? 'contained' : 'outlined'}
            onClick={() => setRange(6)}
          >
            6M
          </Button>
          <Button 
            variant={range === 12 ? 'contained' : 'outlined'}
            onClick={() => setRange(12)}
          >
            1Y
          </Button>
        </ButtonGroup>
      </Stack>

      {/* Heatmap Grid */}
      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <Box sx={{ display: 'flex', minWidth: 'fit-content' }}>
          {/* Day labels */}
          <Box sx={{ display: 'flex', flexDirection: 'column', mr: 0.5 }}>
            <Box sx={{ height: 20 }} /> {/* Space for month labels */}
            {DAYS.map((day, i) => (
              <Typography 
                key={day} 
                variant="caption" 
                sx={{ 
                  height: 14, 
                  lineHeight: '14px',
                  display: i % 2 === 1 ? 'block' : 'none', // Show only Mon, Wed, Fri
                  fontSize: 10,
                  color: 'text.secondary',
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Weeks */}
          <Box sx={{ display: 'flex', gap: '3px' }}>
            {weeks.map((week, weekIndex) => (
              <Box key={weekIndex} sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Month label */}
                <Box sx={{ height: 16 }}>
                  {monthLabels.find(l => l.weekIndex === weekIndex) && (
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
                      {monthLabels.find(l => l.weekIndex === weekIndex)?.month}
                    </Typography>
                  )}
                </Box>
                
                {/* Day cells */}
                {week.map((day) => {
                  const dateStr = formatDate(day);
                  const minutes = data[dateStr] || 0;
                  const isToday = formatDate(new Date()) === dateStr;
                  
                  return (
                    <Tooltip 
                      key={dateStr}
                      title={`${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${minutes} minutes`}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '2px',
                          bgcolor: getIntensityColor(minutes),
                          border: isToday ? '2px solid' : 'none',
                          borderColor: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.2)',
                          },
                          transition: 'transform 0.1s',
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Legend and Stats */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
        {/* Legend */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary">Less</Typography>
          {[0, 10, 25, 45, 90].map(mins => (
            <Box
              key={mins}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '2px',
                bgcolor: getIntensityColor(mins),
              }}
            />
          ))}
          <Typography variant="caption" color="text.secondary">More</Typography>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <StreakIcon sx={{ fontSize: 16, color: 'error.main' }} />
            <Typography variant="body2">
              Longest: <strong>{stats?.longest_streak || 0} days</strong>
            </Typography>
          </Stack>
          <Typography variant="body2">
            Total: <strong>{stats?.total_hours || 0}h</strong>
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

import { useMemo, useState } from 'react';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CalendarMonth, CheckCircle, DragIndicator, Event } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import { plannerApi } from '../../api';
import { useGamification } from '../../context/GamificationContext';

const subjectPalette = ['#5f8d4e', '#c08c5d', '#4c8d9d', '#9d5ca0', '#e0924a'];

const PlannerPage = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const gamification = useGamification();
  const [form, setForm] = useState({
    session_type: 'Deep work',
    start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
    duration: 50,
    focus_score: 8,
    notes: '',
  });
  const [draggedSession, setDraggedSession] = useState(null);

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await plannerApi.list();
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => plannerApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      setForm((prev) => ({ ...prev, notes: '' }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => plannerApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries(['sessions']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => plannerApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries(['sessions']),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    createMutation.mutate({
      ...form,
      start_time: new Date(form.start_time).toISOString(),
    });
  };

  const handleComplete = (session) => {
    updateMutation.mutate({
      id: session.id,
      payload: { end_time: new Date().toISOString() },
    });
    gamification.recordPlannerVictory(1);
  };

  const days = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, index) => ({
        label: dayjs().add(index, 'day'),
      })),
    [],
  );

  const sessionsByDay = useMemo(() => {
    const map = {};
    sessionsQuery.data?.forEach((session) => {
      const key = dayjs(session.start_time).format('YYYY-MM-DD');
      map[key] = map[key] || [];
      map[key].push(session);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
    return map;
  }, [sessionsQuery.data]);

  const upcoming = useMemo(
    () =>
      [...(sessionsQuery.data || [])]
        .filter((session) => session.status !== 'completed')
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .slice(0, 6),
    [sessionsQuery.data],
  );

  const handleDrop = (day, event) => {
    event.preventDefault();
    if (!draggedSession) return;
    const original = dayjs(draggedSession.start_time);
    const nextDate = day.label;
    const updatedStart = nextDate.hour(original.hour()).minute(original.minute());
    updateMutation.mutate({
      id: draggedSession.id,
      payload: { start_time: updatedStart.toDate().toISOString() },
    });
    setDraggedSession(null);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        Planner & ritual calendar
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card component="form" onSubmit={handleSubmit}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Schedule a session
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Focus block"
                  value={form.session_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, session_type: e.target.value }))}
                  required
                />
                <TextField
                  label="Start time"
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
                  required
                />
                <TextField
                  label="Duration (min)"
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                />
                <TextField
                  label="Focus target (1-10)"
                  type="number"
                  value={form.focus_score}
                  onChange={(e) => setForm((prev) => ({ ...prev, focus_score: Number(e.target.value) }))}
                />
                <TextField
                  label="Notes / rituals"
                  multiline
                  minRows={2}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
                <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
                  Add to calendar
                </Button>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <CalendarMonth color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Upcoming deadlines
                </Typography>
              </Stack>
              <Stack spacing={1.5}>
                {upcoming.map((session) => (
                  <Box key={session.id} sx={{ border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`, borderRadius: 2, p: 1.5 }}>
                    <Typography fontWeight={600}>{session.session_type}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(session.start_time).format('MMM D, h:mm A')}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1}>
                      <Chip size="small" label={`${session.duration || 0} min`} />
                      <Chip size="small" label={session.status} color={session.status === 'completed' ? 'success' : 'warning'} />
                    </Stack>
                  </Box>
                ))}
                {!upcoming.length && <EmptyState title="No upcoming sessions" description="Plan a ritual to see it here." />}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Event color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Weekly canvas
                </Typography>
              </Stack>
              {sessionsQuery.isLoading ? (
                <LoadingState label="Loading sessions..." />
              ) : (
                <Grid container spacing={2}>
                  {days.map((day) => {
                    const key = day.label.format('YYYY-MM-DD');
                    const sessions = sessionsByDay[key] || [];
                    return (
                      <Grid item xs={12} md={6} key={key}>
                        <Box
                          sx={{
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                            minHeight: 220,
                            p: 2,
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleDrop(day, event)}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography fontWeight={600}>{day.label.format('ddd, MMM D')}</Typography>
                            <Chip size="small" label={`${sessions.length} tasks`} />
                          </Stack>
                          <Stack spacing={1.5}>
                            {sessions.map((session) => (
                              <PlannerCard
                                key={session.id}
                                session={session}
                                onComplete={() => handleComplete(session)}
                                onDelete={() => deleteMutation.mutate(session.id)}
                                onDragStart={() => setDraggedSession(session)}
                              />
                            ))}
                            {!sessions.length && (
                              <Typography variant="body2" color="text.secondary">
                                Drop a card here to schedule.
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

const PlannerCard = ({ session, onComplete, onDelete, onDragStart }) => {
  const theme = useTheme();
  const color = getColorForSubject(session.session_type);
  return (
    <Box
      draggable
      onDragStart={onDragStart}
      sx={{
        borderRadius: 2,
        p: 1.5,
        border: `1px solid ${color}`,
        background: alpha(theme.palette.background.paper, 0.95),
        boxShadow: theme.palette.mode === 'light' 
          ? '0 10px 20px rgba(0,0,0,0.08)' 
          : '0 10px 20px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'grab',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <DragIndicator fontSize="small" sx={{ color }} />
        <Typography fontWeight={600}>{session.session_type}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {dayjs(session.start_time).format('h:mm A')} · {session.duration || 0} min
      </Typography>
      {session.notes && (
        <Typography variant="body2" mt={0.5}>
          {session.notes}
        </Typography>
      )}
      <Stack direction="row" spacing={1} mt={1}>
        <Chip size="small" label={session.status} color={session.status === 'completed' ? 'success' : 'warning'} />
        <Chip size="small" label={`Focus ${session.focus_score}/10`} />
      </Stack>
      <Stack direction="row" spacing={1} mt={1}>
        {session.status !== 'completed' && (
          <Button size="small" startIcon={<CheckCircle />} onClick={onComplete}>
            Complete
          </Button>
        )}
        <Button size="small" color="error" onClick={onDelete}>
          Delete
        </Button>
      </Stack>
    </Box>
  );
};

const getColorForSubject = (subject = '') => {
  const hash = subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return subjectPalette[hash % subjectPalette.length];
};

export default PlannerPage;

import { useState } from 'react';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import { plannerApi } from '../../api';

const PlannerPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    session_type: 'Deep work',
    start_time: new Date().toISOString().slice(0, 16),
    duration: 50,
    focus_score: 8,
    notes: '',
  });

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
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        Study planner
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Schedule a session
              </Typography>
              <Stack spacing={2} component="form" onSubmit={handleSubmit}>
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
                  label="Notes"
                  multiline
                  minRows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
                <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
                  Add to planner
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Upcoming & recent sessions
              </Typography>
              {sessionsQuery.isLoading ? (
                <LoadingState label="Loading sessions..." />
              ) : sessionsQuery.data?.length ? (
                <Stack spacing={2}>
                  {sessionsQuery.data.map((session) => (
                    <Box
                      key={session.id}
                      sx={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <div>
                          <Typography fontWeight={600}>{session.session_type}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(session.start_time).toLocaleString()}
                          </Typography>
                          {session.notes && (
                            <Typography variant="body2" mt={0.5}>
                              {session.notes}
                            </Typography>
                          )}
                        </div>
                        <Stack direction="row" spacing={1}>
                          <Chip label={`${session.duration || 0} min`} />
                          <Chip
                            label={session.status}
                            color={session.status === 'completed' ? 'success' : session.status === 'in_progress' ? 'warning' : 'default'}
                          />
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={1} mt={1.5}>
                        {session.status !== 'completed' && (
                          <Button size="small" onClick={() => handleComplete(session)}>
                            Mark completed
                          </Button>
                        )}
                        <Button size="small" color="error" onClick={() => deleteMutation.mutate(session.id)}>
                          Delete
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyState title="No sessions yet" description="Plan your next study sprint." />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default PlannerPage;

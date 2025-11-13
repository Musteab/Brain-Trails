import { useMemo } from 'react';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Grid, Stack, Typography, Card, CardContent, Divider, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  AutoStories,
  EmojiEvents,
  FlashOn,
  PlaylistAddCheck,
  Schedule,
  Timer,
} from '@mui/icons-material';

import StatCard from '../../components/common/StatCard';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { statsApi } from '../../api';

const DashboardPage = () => {
  const {
    data: overview,
    isLoading: overviewLoading,
    error,
  } = useQuery({
    queryKey: ['stats-overview'],
    queryFn: async () => {
      const { data } = await statsApi.overview();
      return data;
    },
  });

  const { data: study } = useQuery({
    queryKey: ['stats-study'],
    queryFn: async () => {
      const { data } = await statsApi.study();
      return data;
    },
  });

  const studyMomentum = useMemo(() => {
    if (!overview) return [];
    const counts = {};
    overview.recent_sessions?.forEach((session) => {
      const day = new Date(session.start_time).toLocaleDateString('en-US', { weekday: 'short' });
      const minutes = session.duration || 0;
      counts[day] = (counts[day] || 0) + minutes;
    });
    return Object.entries(counts).map(([day, minutes]) => ({ day, minutes }));
  }, [overview]);

  if (overviewLoading) {
    return <LoadingState label="Loading your workspace..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load stats" description="Please refresh the page." />;
  }

  return (
    <Stack spacing={4}>
      <Typography variant="h4" fontWeight={700}>
        Focused learning at a glance
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatCard
            label="Flashcards created"
            value={overview.flashcards_created}
            icon={PlaylistAddCheck}
            trend={`${overview.flashcards_due} due today`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label="Notes curated"
            value={overview.notes_created}
            icon={AutoStories}
            trend="Keep capturing insights"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label="Quizzes completed"
            value={overview.quizzes_completed}
            icon={EmojiEvents}
            trend={`${overview.quizzes_created} generated`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Minutes studied" value={overview.minutes_studied} icon={Timer} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label="Weekly sessions"
            value={study?.weekly_sessions || 0}
            icon={Schedule}
            trend={`${study?.total_sessions || 0} total`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label="Avg. focus score"
            value={study?.average_focus || 0}
            icon={FlashOn}
            trend="Goal: stay above 7"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={1}>
                Study momentum
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Track minutes logged per day this week.
              </Typography>
              {studyMomentum.length === 0 ? (
                <EmptyState title="No sessions yet" description="Log a study session to see insights." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={studyMomentum}>
                    <XAxis dataKey="day" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="#6366F1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Recent sessions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {overview.recent_sessions?.length ? (
                  overview.recent_sessions.map((session) => (
                    <Stack
                      key={session.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <div>
                        <Typography fontWeight={600}>{session.session_type}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(session.start_time).toLocaleString()}
                        </Typography>
                      </div>
                      <Chip label={`${session.duration || 0} min`} color="primary" variant="outlined" />
                    </Stack>
                  ))
                ) : (
                  <EmptyState title="No recent activity" description="Schedule your next focus block." />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default DashboardPage;

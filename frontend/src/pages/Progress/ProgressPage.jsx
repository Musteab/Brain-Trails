import { useMemo } from 'react';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { statsApi } from '../../api';

const ProgressPage = () => {
  const overviewQuery = useQuery({
    queryKey: ['stats-overview'],
    queryFn: async () => {
      const { data } = await statsApi.overview();
      return data;
    },
  });

  const studyQuery = useQuery({
    queryKey: ['stats-study'],
    queryFn: async () => {
      const { data } = await statsApi.study();
      return data;
    },
  });

  const flowData = useMemo(() => {
    if (!overviewQuery.data) return [];
    return overviewQuery.data.recent_sessions?.map((session) => ({
      time: new Date(session.start_time).toLocaleDateString(),
      minutes: session.duration || 0,
      focus: session.focus_score || 0,
    }));
  }, [overviewQuery.data]);

  if (overviewQuery.isLoading || studyQuery.isLoading) {
    return <LoadingState label="Crunching the numbers..." />;
  }

  if (overviewQuery.isError) {
    return <EmptyState title="Unable to load analytics" description="Please refresh." />;
  }

  const overview = overviewQuery.data;
  const study = studyQuery.data;

  return (
    <Stack spacing={4}>
      <Typography variant="h4" fontWeight={700}>
        Trends & insights
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <MetricCard title="Cards ready for review" value={overview.flashcards_due} subtitle="Stay on streak" />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Average focus score"
            value={study.average_focus}
            subtitle={`${study.total_sessions} sessions logged`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            title="Minutes this week"
            value={study.total_minutes}
            subtitle={`${study.weekly_sessions} sessions`}
          />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={1}>
            Session energy
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Compare minutes logged and focus scores per session.
          </Typography>
          {flowData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={flowData}>
                <XAxis dataKey="time" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip />
                <Area type="monotone" dataKey="minutes" stroke="#6366F1" fill="rgba(99,102,241,0.4)" />
                <Area type="monotone" dataKey="focus" stroke="#34D399" fill="rgba(52,211,153,0.3)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No data yet" description="Log study sessions to unlock insights." />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

const MetricCard = ({ title, value, subtitle }) => (
  <Card>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    </CardContent>
  </Card>
);

export default ProgressPage;

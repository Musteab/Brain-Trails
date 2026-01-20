import { useMemo, useState } from 'react';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Cell } from 'recharts';
import { 
  Card, 
  CardContent, 
  Grid, 
  Stack, 
  Typography, 
  Box, 
  Tabs, 
  Tab,
  Chip,
  LinearProgress,
  Divider,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  TrendingUp, 
  CalendarMonth, 
  EmojiEvents, 
  MenuBook,
  Quiz as QuizIcon,
  Style as FlashcardIcon,
  Timer,
  LocalFireDepartment,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import StudyHeatmap from '../../components/common/StudyHeatmap';
import InsightsCard from '../../components/common/InsightsCard';
import { statsApi, analyticsApi } from '../../api';

const ProgressPage = () => {
  const theme = useTheme();
  const [reportTab, setReportTab] = useState(0);

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

  const weeklyQuery = useQuery({
    queryKey: ['analytics-weekly'],
    queryFn: async () => {
      const { data } = await analyticsApi.getWeeklySummary();
      return data.ok ? data.data : data;
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

      {/* Weekly/Monthly Report */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              Progress Reports
            </Typography>
            <Tabs value={reportTab} onChange={(_, v) => setReportTab(v)} size="small">
              <Tab label="This Week" />
              <Tab label="This Month" disabled />
            </Tabs>
          </Stack>
          
          {weeklyQuery.isLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <LinearProgress />
            </Box>
          ) : weeklyQuery.data ? (
            <Grid container spacing={3}>
              {/* XP Summary */}
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <EmojiEvents sx={{ color: 'warning.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">XP Earned</Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight={700} color="warning.dark">
                    {weeklyQuery.data.total_xp || 0}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={`${weeklyQuery.data.activity_count || 0} activities`}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>

              {/* Time Summary */}
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Timer sx={{ color: 'info.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">Study Time</Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight={700} color="info.dark">
                    {Math.round(weeklyQuery.data.total_minutes || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">minutes total</Typography>
                </Box>
              </Grid>

              {/* Days Active */}
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <LocalFireDepartment sx={{ color: 'success.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">Days Active</Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight={700} color="success.dark">
                    {weeklyQuery.data.days_active || 0}/7
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(weeklyQuery.data.days_active || 0) / 7 * 100}
                    sx={{ mt: 1, borderRadius: 1 }}
                    color="success"
                  />
                </Box>
              </Grid>

              {/* Activity Breakdown */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" mb={2}>
                  Activity Breakdown
                </Typography>
                <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MenuBook fontSize="small" color="primary" />
                    <Typography variant="body2">
                      <strong>{weeklyQuery.data.notes_created || 0}</strong> notes created
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <QuizIcon fontSize="small" color="secondary" />
                    <Typography variant="body2">
                      <strong>{weeklyQuery.data.quizzes_completed || 0}</strong> quizzes completed
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FlashcardIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>{weeklyQuery.data.cards_reviewed || 0}</strong> cards reviewed
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          ) : (
            <EmptyState 
              title="No data for this period" 
              description="Start studying to see your progress report."
            />
          )}
        </CardContent>
      </Card>

      {/* Study Activity Heatmap */}
      <StudyHeatmap />

      {/* AI-Generated Insights */}
      <InsightsCard />
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

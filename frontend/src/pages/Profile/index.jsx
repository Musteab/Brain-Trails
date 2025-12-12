/**
 * Profile Page - Clean, modern profile display
 * Shows user achievements, stats, activity, and customization
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import api from '../../api/client';
import ProfileHeader from './components/ProfileHeader';
import AchievementsShowcase from './components/AchievementsShowcase';
import StudyStats from './components/StudyStats';
import StudyHeatmap from './components/StudyHeatmap';
import RecentActivity from './components/RecentActivity';
import PetShowcase from './components/PetShowcase';
import PublicProfileToggle from './components/PublicProfileToggle';
import EditProfileModal from './EditProfile';

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activityPage, setActivityPage] = useState(1);

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get('/api/profile/me');
      return res.data;
    },
  });

  // Fetch achievements
  const { data: achievementsData, isLoading: achievementsLoading } = useQuery({
    queryKey: ['profile', 'achievements'],
    queryFn: async () => {
      const res = await api.get('/api/profile/achievements');
      return res.data;
    },
  });

  // Fetch detailed stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: async () => {
      const res = await api.get('/api/profile/stats');
      return res.data;
    },
  });

  // Fetch heatmap data
  const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
    queryKey: ['profile', 'heatmap'],
    queryFn: async () => {
      const res = await api.get('/api/profile/heatmap');
      return res.data;
    },
  });

  // Fetch activity feed
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['profile', 'activity', activityPage],
    queryFn: async () => {
      const res = await api.get(`/api/profile/activity?page=${activityPage}&per_page=10`);
      return res.data;
    },
  });

  // Fetch pets
  const { data: petsData, isLoading: petsLoading } = useQuery({
    queryKey: ['profile', 'pets'],
    queryFn: async () => {
      const res = await api.get('/api/profile/pets');
      return res.data;
    },
  });

  // Toggle public profile mutation
  const togglePublicMutation = useMutation({
    mutationFn: async (isPublic) => {
      const res = await api.post('/api/profile/public', { is_public: isPublic });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });

  const handleLoadMoreActivity = () => {
    setActivityPage((prev) => prev + 1);
  };

  // Combine profile data with stats
  const enrichedProfile = profileData ? {
    ...profileData.profile,
    username: profileData.username,
    stats: profileData.stats,
    created_at: profileData.joined_at,
  } : null;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Top Navigation */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
        <IconButton onClick={() => navigate('/settings')}>
          <SettingsIcon />
        </IconButton>
      </Stack>

      {/* Profile Header */}
      <ProfileHeader
        profile={enrichedProfile}
        gamification={profileData?.gamification}
        isOwner={true}
        onEdit={() => setEditModalOpen(true)}
        loading={profileLoading}
      />

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Main Content */}
        <Grid item xs={12} md={8}>
          {/* Achievements */}
          <AchievementsShowcase
            achievements={achievementsData?.achievements}
            loading={achievementsLoading}
            onViewAll={() => navigate('/profile/achievements')}
          />

          {/* Study Heatmap */}
          <StudyHeatmap
            heatmapData={heatmapData?.heatmap}
            stats={heatmapData?.stats}
            loading={heatmapLoading}
          />

          {/* Study Stats */}
          <StudyStats
            stats={statsData}
            loading={statsLoading}
          />

          {/* Recent Activity */}
          <RecentActivity
            activities={activityData?.activities}
            loading={activityLoading}
            hasMore={activityData?.has_more}
            onLoadMore={handleLoadMoreActivity}
          />
        </Grid>

        {/* Right Column - Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Pet Collection */}
          <PetShowcase
            pets={petsData?.pets}
            loading={petsLoading}
          />

          {/* Public Profile Toggle */}
          <PublicProfileToggle
            isPublic={profileData?.profile?.is_public}
            username={profileData?.username}
            onToggle={(isPublic) => togglePublicMutation.mutate(isPublic)}
            loading={togglePublicMutation.isPending}
          />
        </Grid>
      </Grid>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={enrichedProfile}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          setEditModalOpen(false);
        }}
      />
    </Container>
  );
}

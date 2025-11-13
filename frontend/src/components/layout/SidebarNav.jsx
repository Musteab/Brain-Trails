import { Book, Dashboard, EventNote, MenuBook, QueryStats, Quiz } from '@mui/icons-material';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', icon: Dashboard, to: '/dashboard' },
  { label: 'Flashcards', icon: MenuBook, to: '/flashcards' },
  { label: 'Notes', icon: Book, to: '/notes' },
  { label: 'Quizzes', icon: Quiz, to: '/quizzes' },
  { label: 'Planner', icon: EventNote, to: '/planner' },
  { label: 'Progress', icon: QueryStats, to: '/progress' },
];

const SidebarNav = () => (
  <Box
    component="nav"
    sx={{
      width: 240,
      borderRight: '1px solid rgba(255,255,255,0.08)',
      p: 2,
      display: { xs: 'none', md: 'block' },
    }}
  >
    <Typography variant="h6" fontWeight={700} mb={3}>
      Brain-Trails
    </Typography>
    <Stack spacing={1.5}>
      {navItems.map(({ label, icon: Icon, to }) => (
        <ButtonBase
          component={NavLink}
          key={label}
          to={to}
          style={({ isActive }) => ({
            borderRadius: 12,
            padding: '12px 16px',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
            backgroundColor: isActive ? 'rgba(99,102,241,0.25)' : 'transparent',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '12px',
            fontWeight: 600,
          })}
        >
          <Icon fontSize="small" />
          {label}
        </ButtonBase>
      ))}
    </Stack>
  </Box>
);

export default SidebarNav;

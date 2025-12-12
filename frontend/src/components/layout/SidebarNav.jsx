import { Dashboard, Description, EventNote, MenuBook, QueryStats, Quiz, Person, Settings } from '@mui/icons-material';
import { Box, ButtonBase, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', icon: Dashboard, to: '/dashboard' },
  { label: 'Notes', icon: Description, to: '/notes' },
  { label: 'Flashcards', icon: MenuBook, to: '/flashcards' },
  { label: 'Quizzes', icon: Quiz, to: '/quizzes' },
  { label: 'Planner', icon: EventNote, to: '/planner' },
  { label: 'Progress', icon: QueryStats, to: '/progress' },
  { label: 'Profile', icon: Person, to: '/profile' },
  { label: 'Settings & FAQ', icon: Settings, to: '/settings' },
];

const heroLogo = `${process.env.PUBLIC_URL || ''}/braintrail-hero.png`;

const SidebarNav = ({ mobile = false, onNavigate }) => {
  const theme = useTheme();
  
  const handleClick = () => {
    if (mobile && onNavigate) {
      onNavigate();
    }
  };

  return (
    <Box
      component="nav"
      sx={{
        width: mobile ? '100%' : 260,
        borderRight: mobile ? 'none' : `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        p: 3,
        display: mobile ? 'block' : { xs: 'none', md: 'block' },
        backgroundColor: alpha(theme.palette.background.paper, 0.92),
        backdropFilter: 'blur(10px)',
        height: mobile ? '100%' : 'auto',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} mb={4}>
        <Box
          component="img"
          src={heroLogo}
          alt="Brain Trails logo"
          sx={{
            width: 56,
            height: 56,
            borderRadius: '40%',
            objectFit: 'cover',
            border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
          }}
        />
        <Box>
          <Typography variant="h6" fontWeight={700} display="flex" gap={0.5} alignItems="center">
            {theme.custom.accentIcon} BrainTrails
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Journey through the {theme.custom.label}
          </Typography>
        </Box>
      </Stack>
      <Stack spacing={1}>
        {navItems.map(({ label, icon: Icon, to }) => (
          <ButtonBase
            component={NavLink}
            key={label}
            to={to}
            onClick={handleClick}
            style={({ isActive }) => ({
              borderRadius: 16,
              padding: '12px 16px',
              color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
              backgroundColor: isActive
                ? alpha(theme.palette.primary.main, 0.18)
                : alpha(theme.palette.text.primary, 0.04),
              border: `1px solid ${alpha(theme.palette.text.primary, isActive ? 0.16 : 0.08)}`,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              fontWeight: 600,
              width: '100%',
              transition: 'background 0.2s ease, transform 0.2s ease',
              boxShadow: isActive ? `0 10px 18px ${alpha(theme.palette.primary.main, 0.25)}` : 'none',
            })}
          >
            <Icon fontSize="small" />
            {label}
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  );
};

export default SidebarNav;

import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
// 1. Impor gambar logo Anda (sesuaikan path relatifnya jika perlu)
import CreateSyncLogo from '../../../assets/images/CreateSyncLogo.png'; 

import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container, 
  IconButton, 
  Tooltip, 
  Badge, 
  Divider,
  CssBaseline 
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  AccountCircle, 
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Groups as TalentIcon,
  AutoAwesomeMosaic as PortfolioIcon
} from '@mui/icons-material';

function MainLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <CssBaseline />
      
      {/* --- AppBar (Header Global) --- */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            
            {/* --- LOGO SECTION (GANTI ICON DENGAN IMAGE) --- */}
            <Box
              component={Link}
              to="/home"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                mr: 4
              }}
            >
              <Box 
                component="img"
                src={CreateSyncLogo}
                alt="CreateSync Logo"
                sx={{ 
                  height: 32, // Sesuaikan tinggi logo agar tidak merusak baris toolbar
                  width: 'auto',
                  mr: 1.5
                }}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 800,
                  letterSpacing: '.05rem',
                  fontSize: '1.1rem',
                  color: 'primary.main', // Warna teks logo bisa disesuaikan
                }}
              >
                CREATE SYNC
              </Typography>
            </Box>

            {/* Link Navigasi Utama */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button
                component={Link}
                to="/home"
                startIcon={<DashboardIcon />}
                sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600, '&:hover': { color: 'primary.main' } }}
              >
                Projects
              </Button>
              <Button
                component={Link}
                to="/talent"
                startIcon={<TalentIcon />}
                sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600, '&:hover': { color: 'primary.main' } }}
              >
                Talent Match
              </Button>
              <Button
                component={Link}
                to="/portfolio/curate"
                startIcon={<PortfolioIcon />}
                sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600, '&:hover': { color: 'primary.main' } }}
              >
                Portfolio
              </Button>
            </Box>

            {/* Bagian Kanan */}
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Notifikasi">
                <IconButton component={Link} to="/notifications" color="inherit">
                  <Badge badgeContent={2} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Edit Profil">
                <IconButton component={Link} to="/profile/edit" color="inherit">
                  <AccountCircle />
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.5 }} />

              <Button 
                onClick={handleLogout}
                variant="outlined" 
                color="error" 
                size="small"
                startIcon={<LogoutIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
              >
                Logout
              </Button>
            </Box>

          </Toolbar>
        </Container>
      </AppBar>

      {/* --- Area Konten Utama --- */}
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>

      {/* --- Footer Sederhana --- */}
      <Box component="footer" sx={{ py: 3, textAlign: 'center', bgcolor: 'white', mt: 'auto', borderTop: '1px solid #e2e8f0' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Create Sync Platform. Built for Creators.
        </Typography>
      </Box>
    </Box>
  );
}

export default MainLayout;
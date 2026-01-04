import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Grid, Paper, Typography, List, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, 
  Divider, Chip, Button, CircularProgress, Card, CardContent
} from '@mui/material';
import { 
  Dashboard as SummaryIcon, 
  Chat as ChatIcon, 
  FolderCopy as FilesIcon, 
  People as MembersIcon,
  Settings as SettingsIcon,
  ArrowBack as BackIcon,
  CalendarMonth as TimelineIcon
} from '@mui/icons-material';

function ProjectDashboardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:3001/api/projects/${projectId}`, {
          headers: { 'x-auth-token': token }
        });
        setProject(res.data);
      } catch (err) {
        console.error('Gagal memuat detail proyek');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetails();
  }, [projectId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return <Typography color="error">Proyek tidak ditemukan.</Typography>;
  }

  // Menu Navigasi Samping Proyek
  const menuItems = [
    { text: 'Ringkasan', icon: <SummaryIcon />, path: `/projects/${projectId}` },
    { text: 'Obrolan', icon: <ChatIcon />, path: `/projects/${projectId}/chat` },
    { text: 'File Hub', icon: <FilesIcon />, path: `/projects/${projectId}/files` },
    { text: 'Anggota', icon: <MembersIcon />, path: `/projects/${projectId}/members` },
  ];

  return (
    <Box>
      {/* Tombol Kembali ke Semua Proyek */}
      <Button 
        startIcon={<BackIcon />} 
        component={RouterLink} 
        to="/home" 
        sx={{ mb: 3, textTransform: 'none' }}
      >
        Kembali ke Dashboard Utama
      </Button>

      <Grid container spacing={3}>
        {/* --- 1. Sidebar Navigasi Proyek (Kiri) --- */}
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Menu Proyek</Typography>
              <Typography variant="h6" fontWeight="bold" noWrap>{project.name}</Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding divider>
                  <ListItemButton 
                    component={RouterLink} 
                    to={item.path}
                    selected={window.location.pathname === item.path}
                  >
                    <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                  </ListItemButton>
                </ListItem>
              ))}
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Pengaturan" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* --- 2. Area Konten Utama (Kanan) --- */}
        <Grid item xs={12} md={9}>
          <Paper elevation={0} variant="outlined" sx={{ p: 4, borderRadius: 2, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>Ringkasan Proyek</Typography>
                <Chip 
                  label={project.status || 'Active'} 
                  color="success" 
                  size="small" 
                  sx={{ fontWeight: 'bold' }} 
                />
              </Box>
              <Button variant="contained" startIcon={<TimelineIcon />}>Lihat Timeline</Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Deskripsi</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {project.description || 'Tidak ada deskripsi yang tersedia untuk proyek ini.'}
                </Typography>
              </Grid>

              {/* Info Statistik Cepat */}
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: '#f0f4ff', border: '1px solid #d0dfff' }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="subtitle2">Total Anggota</Typography>
                    <Typography variant="h4" fontWeight="bold">0</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: '#f0fff4', border: '1px solid #d0ffd9' }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="subtitle2">File Dibagikan</Typography>
                    <Typography variant="h4" fontWeight="bold">0</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: '#fffcf0', border: '1px solid #fff5d0' }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="subtitle2">Pesan Chat</Typography>
                    <Typography variant="h4" fontWeight="bold">0</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProjectDashboardPage;
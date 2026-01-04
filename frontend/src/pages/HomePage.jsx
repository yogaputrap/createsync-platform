// Nama file: frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Typography, Grid, Card, CardContent, CardActions, 
  Button, Avatar, Chip, Stack, Paper, 
  CircularProgress, Divider, Tooltip, Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  ArrowForward as ViewIcon, 
  Assignment as ProjectIcon,
  Notifications as NotifIcon,
  ChatBubbleOutline as MessageIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';

function HomePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMsg("Sesi berakhir. Silakan login kembali.");
        setLoading(false);
        return;
      }

      const config = { headers: { 'x-auth-token': token } };

      try {
        // --- 1. Ambil Info User (Gunakan try-catch terpisah agar tidak memblokir proyek) ---
        try {
          const userRes = await axios.get('http://localhost:3001/api/auth/user', config);
          setUser(userRes.data);
        } catch (uErr) {
          console.warn("Endpoint /api/auth/user gagal atau belum ada. Menggunakan nama default.");
        }

        // --- 2. Ambil Daftar Proyek ---
        const projectRes = await axios.get('http://localhost:3001/api/projects', config);
        
        console.log("Data Proyek Diterima:", projectRes.data);

        // Penanganan format data yang fleksibel
        if (Array.isArray(projectRes.data)) {
          setProjects(projectRes.data);
        } else if (projectRes.data && Array.isArray(projectRes.data.projects)) {
          setProjects(projectRes.data.projects);
        } else {
          setProjects([]);
        }

      } catch (err) {
        console.error("Gagal mengambil proyek:", err);
        setErrorMsg("Gagal memuat daftar proyek. Pastikan server backend aktif.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ pb: 5 }}>
      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      {/* Hero Welcome */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="900">
          Halo, {user?.full_name?.split(' ')[0] || 'Kreator'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Berikut adalah ringkasan proyek dan aktivitas Anda.
        </Typography>
      </Box>

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {[
          { label: 'Proyek Aktif', val: projects.length, icon: <ProjectIcon />, color: 'primary' },
          { label: 'Pesan Baru', val: 0, icon: <MessageIcon />, color: 'success' },
          { label: 'Notifikasi', val: 0, icon: <NotifIcon />, color: 'warning' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${stat.color}.light`, color: `${stat.color}.main` }}>{stat.icon}</Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">{stat.val}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Daftar Proyek</Typography>
        <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/create-project">
          Proyek Baru
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '2px dashed #ccc' }}>
          <ErrorIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6">Tidak ada proyek ditemukan</Typography>
          <Button variant="text" component={RouterLink} to="/create-project" sx={{ mt: 1 }}>
            Buat proyek sekarang
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.project_id}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}>
                <CardContent>
                  <Chip label={project.category || 'General'} size="small" color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" noWrap>{project.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ height: 40, overflow: 'hidden' }}>
                    {project.description}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button fullWidth endIcon={<ViewIcon />} component={RouterLink} to={`/projects/${project.project_id}`}>
                    Buka Proyek
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default HomePage;
import React, { useState, useEffect } from 'react';
// 1. Tambahkan useNavigate ke dalam import
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Container, Typography, Grid, Paper, Avatar, 
  Chip, Button, Divider, Stack, Card, CardContent, 
  CardMedia, CircularProgress, IconButton, Tooltip,
  Tab, Tabs
} from '@mui/material';
import { 
  Email as MessageIcon, 
  AddCircle as InviteIcon, 
  LocationOn as LocationIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Language as WebIcon,
  Verified as VerifiedIcon,
  ArrowBack as BackIcon, // 2. Import icon kembali
  EventAvailable as AvailabilityIcon
} from '@mui/icons-material';

import InviteToProjectModal from '../components/InviteToProjectModal';

function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate(); // 3. Inisialisasi navigate
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/profile/user/${userId}`);
        setProfile(res.data.profile);
        setProjects(res.data.projects);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', pb: 4 }}>
      {/* --- BANNER COMPACT --- */}
      <Box sx={{ height: 140, background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)' }} />

      <Container maxWidth="lg" sx={{ mt: -8 }}>
        {/* 4. TOMBOL KEMBALI (Compact & Minimalist) */}
        <Box sx={{ mt: -15, mb: 7, display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
            sx={{ 
              textTransform: 'none', 
              color: 'white', 
              fontWeight: 600,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } 
            }}
          >
            Kembali
          </Button>
        </Box>

        <Grid container spacing={2}>
          {/* --- SIDEBAR: INFO RINGKAS --- */}
          <Grid item xs={12} md={3.5}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 110, height: 110, mx: 'auto', mt: -6, 
                  border: '4px solid white', bgcolor: 'primary.main', fontSize: '2.5rem'
                }}
              >
                {profile?.full_name[0]}
              </Avatar>

              <Box sx={{ mt: 1.5, mb: 2 }}>
                <Typography variant="h6" fontWeight="800" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                  {profile?.full_name} <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="500">
                  {profile?.headline}
                </Typography>
                
                <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <LocationIcon sx={{ fontSize: 14, color: 'action.active' }} />
                    <Typography variant="caption" color="text.secondary">{profile?.location || 'Remote'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <AvailabilityIcon sx={{ fontSize: 14, color: 'success.main' }} />
                    <Typography variant="caption" fontWeight="bold" color="success.main">{profile?.availability}</Typography>
                  </Box>
                </Stack>
              </Box>

              <Stack spacing={1}>
                {isLoggedIn && (
                  <Button variant="contained" size="small" startIcon={<InviteIcon />} onClick={() => setShowInviteModal(true)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                    Undang
                  </Button>
                )}
                <Button variant="outlined" size="small" startIcon={<MessageIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Chat
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={0.5} justifyContent="center">
                <Tooltip title="GitHub"><IconButton size="small" href={profile?.external_links?.github} target="_blank"><GitHubIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="LinkedIn"><IconButton size="small" color="primary" href={profile?.external_links?.linkedin} target="_blank"><LinkedInIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Website"><IconButton size="small" color="secondary"><WebIcon fontSize="small" /></IconButton></Tooltip>
              </Stack>
            </Paper>
          </Grid>

          {/* --- MAIN CONTENT --- */}
          <Grid item xs={12} md={8.5}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', minHeight: '100%' }}>
              <Tabs 
                value={tabValue} 
                onChange={(e, v) => setTabValue(v)} 
                sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#fafafa' }}
                variant="standard"
              >
                <Tab label="Info & Bio" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
                <Tab label={`Portofolio (${projects.length})`} sx={{ textTransform: 'none', fontWeight: 'bold' }} />
              </Tabs>

              <Box sx={{ p: 2.5 }}>
                {tabValue === 0 ? (
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Tentang</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, mb: 3 }}>
                      {profile?.bio || 'Belum ada biografi.'}
                    </Typography>

                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Tech Stack</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                      {profile?.skills?.map((s) => (
                        <Chip key={s} label={s} size="small" sx={{ fontWeight: 600, bgcolor: '#eef2ff', color: '#4338ca' }} />
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {projects.length > 0 ? projects.map(project => (
                      <Grid item xs={12} sm={6} key={project.project_id}>
                        <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                          <CardMedia
                            component="img"
                            height="100"
                            image={`https://source.unsplash.com/random/400x200?code,${project.project_id}`}
                          />
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography variant="body1" fontWeight="bold" noWrap>{project.project_name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ 
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mt: 0.5 
                            }}>
                              {project.contribution_desc}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )) : (
                      <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Belum ada portofolio.</Typography>
                      </Grid>
                    )}
                  </Grid>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {showInviteModal && <InviteToProjectModal talent={{ ...profile, user_id: userId }} onClose={() => setShowInviteModal(false)} />}
    </Box>
  );
}

export default PublicProfilePage;
// Nama file: frontend/src/pages/TalentDiscoveryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, Typography, Grid, Card, CardContent, CardActions, 
  Button, Avatar, Chip, TextField, InputAdornment, 
  Paper, Divider, CircularProgress, MenuItem, Select,
  FormControl, InputLabel, Tab, Tabs, Alert
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocationOn as LocationIcon,
  EventAvailable as AvailabilityIcon,
  WorkOutline as ProjectIcon,
  PersonSearch as TalentIcon
} from '@mui/icons-material';

// --- Sub-Komponen: Kartu Talent MUI ---
const TalentCardMUI = ({ talent }) => (
  <Card elevation={3} sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          {talent.full_name ? talent.full_name[0] : '?'}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold" component={RouterLink} to={`/profile/${talent.user_id}`} sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}>
            {talent.full_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">{talent.headline || 'Creative Talent'}</Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationIcon fontSize="small" color="action" />
          <Typography variant="caption">{talent.location || 'Remote / No Location'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AvailabilityIcon fontSize="small" color="success" />
          <Typography variant="caption" fontWeight="bold" color="success.main">{talent.availability || 'Available'}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {talent.skills && talent.skills.map(skill => (
          <Chip key={skill} label={skill} size="small" variant="outlined" />
        ))}
      </Box>
    </CardContent>
    <Divider />
    <CardActions sx={{ justifyContent: 'center', p: 1.5 }}>
      <Button variant="contained" size="small" fullWidth component={RouterLink} to={`/profile/${talent.user_id}`}>
        Lihat Profil
      </Button>
    </CardActions>
  </Card>
);

// --- Sub-Komponen: Kartu Proyek Terbuka MUI ---
const OpenProjectCardMUI = ({ project }) => (
  <Card elevation={2} variant="outlined" sx={{ borderRadius: 3, height: '100%', borderLeft: '5px solid #1976d2' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" fontWeight="bold">{project.name}</Typography>
        <Chip label={project.category || 'General'} size="small" color="info" />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Dikelola oleh: <strong>{project.owner_name}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {project.description || 'Tidak ada deskripsi tersedia.'}
      </Typography>
    </CardContent>
    <CardActions>
      <Button size="small" startIcon={<SearchIcon />} component={RouterLink} to={`/projects/${project.project_id}`}>
        Detail Proyek
      </Button>
    </CardActions>
  </Card>
);

function TalentDiscoveryPage() {
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({ skill: '', location: '', availability: '' });
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [openProjects, setOpenProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Fungsi untuk mengambil Talenta (digunakan saat mount & saat cari)
  const fetchTalents = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.get('http://localhost:3001/api/profile/search', { params: currentFilters });
      setResults(res.data);
      if (res.data.length === 0) setMessage('Tidak ada talenta yang ditemukan.');
    } catch (err) {
      console.error(err);
      setMessage('Gagal memuat data talenta.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fungsi untuk mengambil Proyek
  const fetchOpenProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/api/projects/public-list');
      setOpenProjects(res.data);
    } catch (err) {
      console.warn('Gagal memuat proyek');
    } finally {
      setProjectsLoading(false);
    }
  };

  // Efek dijalankan sekali saat mount
  useEffect(() => {
    fetchTalents(); // Ambil semua user di awal
    fetchOpenProjects(); // Ambil semua proyek di awal
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTalents();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Talent & Project Discovery</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>Temukan kolaborator atau proyek yang tepat untuk masa depan Anda.</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, newVal) => setTabValue(newVal)}>
          <Tab icon={<TalentIcon />} iconPosition="start" label="Cari Talenta" />
          <Tab icon={<ProjectIcon />} iconPosition="start" label="Proyek Terbuka" />
        </Tabs>
      </Box>

      {/* PANEL 1: CARI TALENTA */}
      {tabValue === 0 && (
        <Box>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 4, bgcolor: '#fbfbfb' }}>
            <form onSubmit={handleSearchSubmit}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField fullWidth size="small" name="skill" label="Skill (cth: React)" value={filters.skill} onChange={onChange} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" name="location" label="Lokasi" value={filters.location} onChange={onChange} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Ketersediaan</InputLabel>
                    <Select name="availability" value={filters.availability} label="Ketersediaan" onChange={onChange}>
                      <MenuItem value="">Semua</MenuItem>
                      <MenuItem value="Available">Tersedia</MenuItem>
                      <MenuItem value="Not Available">Tidak Tersedia</MenuItem>
                      <MenuItem value="Open to Offers">Terbuka</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="contained" type="submit" disabled={loading} startIcon={<SearchIcon />}>
                    {loading ? '...' : 'Cari'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>

          {message && !loading && <Alert severity="info" sx={{ mb: 3 }}>{message}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {results.map(talent => (
                <Grid item xs={12} sm={6} md={4} key={talent.user_id}>
                  <TalentCardMUI talent={talent} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* PANEL 2: PROYEK TERBUKA */}
      {tabValue === 1 && (
        <Box>
          {projectsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {openProjects.map(project => (
                <Grid item xs={12} sm={6} md={4} key={project.project_id}>
                  <OpenProjectCardMUI project={project} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
}

export default TalentDiscoveryPage;
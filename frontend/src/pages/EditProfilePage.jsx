import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  Grid, Avatar, Divider, Alert, MenuItem, Select, 
  FormControl, InputLabel, InputAdornment, CircularProgress,
  Stack
} from '@mui/material';
import { 
  Save as SaveIcon, 
  GitHub as GitHubIcon, 
  LinkedIn as LinkedInIcon,
  Badge as NameIcon,
  WorkOutline as HeadlineIcon,
  LocationOn as LocationIcon,
  Psychology as SkillIcon,
  Description as BioIcon
} from '@mui/icons-material';

function EditProfilePage() {
    const [profile, setProfile] = useState({
        full_name: '',
        headline: '',
        bio: '',
        skills: [],
        external_links: { github: '', linkedin: '' },
        availability: 'Available',
        location: ''
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) {
                navigate('/signin');
                return;
            }
            try {
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get('http://localhost:3001/api/profile/me', config);
                
                setProfile({
                    full_name: res.data.full_name || '',
                    headline: res.data.headline || '',
                    bio: res.data.bio || '',
                    skills: res.data.skills || [],
                    external_links: res.data.external_links || { github: '', linkedin: '' },
                    availability: res.data.availability || 'Available',
                    location: res.data.location || ''
                });
            } catch (err) {
                setMessage({ text: 'Gagal memuat profil', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token, navigate]);

    const onChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const onSkillsChange = (e) => {
        setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) });
    };

    const onLinkChange = (e) => {
        setProfile({
            ...profile,
            external_links: {
                ...profile.external_links,
                [e.target.name]: e.target.value
            }
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (!profile.full_name || !profile.headline) {
            setMessage({ text: 'Nama Lengkap dan Headline wajib diisi.', type: 'error' });
            return;
        }
        if (profile.skills.length === 0 || (profile.skills.length === 1 && profile.skills[0] === '')) {
             setMessage({ text: 'Skill wajib diisi (minimal satu).', type: 'error' });
            return;
        }

        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            await axios.put('http://localhost:3001/api/profile', profile, config);
            setMessage({ text: 'Profil berhasil diperbarui!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.msg || 'Gagal menyimpan profil', type: 'error' });
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Edit Profil
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                Atur informasi diri Anda agar kolaborator dapat menemukan bakat Anda.
            </Typography>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 3 }}>
                    {message.text}
                </Alert>
            )}

            <form onSubmit={onSubmit}>
                <Grid container spacing={4}>
                    {/* Sisi Kiri: Ringkasan Visual */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
                            <Avatar 
                                sx={{ 
                                    width: 100, 
                                    height: 100, 
                                    mx: 'auto', 
                                    mb: 2, 
                                    bgcolor: 'primary.main',
                                    fontSize: '2.5rem'
                                }}
                            >
                                {profile.full_name ? profile.full_name[0] : '?'}
                            </Avatar>
                            <Typography variant="h6" fontWeight="bold">{profile.full_name || "Nama Anda"}</Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {profile.headline || "Headline Profil"}
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <FormControl fullWidth size="small">
                                <InputLabel>Status Ketersediaan</InputLabel>
                                <Select
                                    name="availability"
                                    value={profile.availability}
                                    label="Status Ketersediaan"
                                    onChange={onChange}
                                >
                                    <MenuItem value="Available">Tersedia</MenuItem>
                                    <MenuItem value="Not Available">Tidak Tersedia</MenuItem>
                                    <MenuItem value="Open to Offers">Terbuka untuk Tawaran</MenuItem>
                                </Select>
                            </FormControl>
                        </Paper>
                    </Grid>

                    {/* Sisi Kanan: Formulir Detail */}
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label="Nama Lengkap"
                                    name="full_name"
                                    value={profile.full_name}
                                    onChange={onChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start"><NameIcon color="primary"/></InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Headline"
                                    name="headline"
                                    placeholder="cth: Desainer Grafis Senior"
                                    value={profile.headline}
                                    onChange={onChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start"><HeadlineIcon color="primary"/></InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Bio"
                                    name="bio"
                                    multiline
                                    rows={4}
                                    value={profile.bio}
                                    onChange={onChange}
                                    placeholder="Ceritakan singkat tentang pengalaman Anda..."
                                />

                                <TextField
                                    fullWidth
                                    label="Skills (Pisahkan dengan koma)"
                                    name="skills"
                                    value={profile.skills.join(', ')}
                                    onChange={onSkillsChange}
                                    placeholder="cth: React, Node.js, Figma"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start"><SkillIcon color="primary"/></InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Lokasi"
                                    name="location"
                                    value={profile.location}
                                    onChange={onChange}
                                    placeholder="cth: Jakarta, Indonesia"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start"><LocationIcon color="primary"/></InputAdornment>
                                        ),
                                    }}
                                />

                                <Typography variant="subtitle1" fontWeight="bold">Tautan Sosial Media</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="GitHub URL"
                                            name="github"
                                            value={profile.external_links.github}
                                            onChange={onLinkChange}
                                            placeholder="https://github.com/..."
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start"><GitHubIcon /></InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="LinkedIn URL"
                                            name="linkedin"
                                            value={profile.external_links.linkedin}
                                            onChange={onLinkChange}
                                            placeholder="https://linkedin.com/in/..."
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start"><LinkedInIcon color="info" /></InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    size="large" 
                                    startIcon={<SaveIcon />}
                                    sx={{ py: 1.5, fontWeight: 'bold', mt: 2 }}
                                >
                                    Simpan Perubahan
                                </Button>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </form>
        </Container>
    );
}

export default EditProfilePage;